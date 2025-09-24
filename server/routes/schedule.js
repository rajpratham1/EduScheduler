const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');
const OpenAI = require('openai');
const { generateSchedulePrompt } = require('../utils/aiPrompts');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get all schedules
router.get('/', verifyToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('schedules').get();
    const schedules = [];
    snapshot.forEach(doc => {
      schedules.push({ id: doc.id, ...doc.data() });
    });
    res.json(schedules);
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Get schedule by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('schedules').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Generate schedule using AI
router.post('/generate', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      department,
      semester,
      constraints,
      preferredTimings
    } = req.body;

    // Fetch required data
    const [subjects, faculty, classrooms] = await Promise.all([
      admin.firestore().collection('subjects')
        .where('department', '==', department)
        .where('semester', '==', semester)
        .get(),
      admin.firestore().collection('faculty')
        .where('department', '==', department)
        .get(),
      admin.firestore().collection('classrooms')
        .where('department', '==', department)
        .get()
    ]);

    // Prepare data for AI
    const subjectsData = [];
    subjects.forEach(doc => {
      subjectsData.push({ id: doc.id, ...doc.data() });
    });

    const facultyData = [];
    faculty.forEach(doc => {
      facultyData.push({ id: doc.id, ...doc.data() });
    });

    const classroomsData = [];
    classrooms.forEach(doc => {
      classroomsData.push({ id: doc.id, ...doc.data() });
    });

    // Generate AI prompt
    const prompt = generateSchedulePrompt({
      subjects: subjectsData,
      faculty: facultyData,
      classrooms: classroomsData,
      constraints,
      preferredTimings
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are an AI assistant that generates optimal class schedules based on given constraints and requirements." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    // Parse AI response
    const schedule = JSON.parse(completion.data.choices[0].message.content);

    // Save generated schedule
    const scheduleData = {
      department,
      semester,
      schedule,
      constraints,
      preferredTimings,
      generatedBy: 'AI',
      status: 'draft',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await admin.firestore().collection('schedules').add(scheduleData);
    
    res.status(201).json({ 
      message: 'Schedule generated successfully', 
      id: docRef.id,
      ...scheduleData
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

// Modify existing schedule with AI suggestions
router.post('/:id/modify', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { changes, constraints } = req.body;

    // Get current schedule
    const scheduleDoc = await admin.firestore()
      .collection('schedules')
      .doc(req.params.id)
      .get();

    if (!scheduleDoc.exists) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const currentSchedule = scheduleDoc.data();

    // Generate AI prompt for modifications
    const prompt = generateModificationPrompt({
      currentSchedule,
      changes,
      constraints
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are an AI assistant that helps modify class schedules while maintaining constraints and optimizing for preferences." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    // Parse AI response
    const modifiedSchedule = JSON.parse(completion.data.choices[0].message.content);

    // Save modified schedule
    const scheduleData = {
      ...currentSchedule,
      schedule: modifiedSchedule,
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
      modificationHistory: admin.firestore.FieldValue.arrayUnion({
        timestamp: new Date().toISOString(),
        changes,
        constraints
      })
    };

    await admin.firestore()
      .collection('schedules')
      .doc(req.params.id)
      .update(scheduleData);

    res.json({ 
      message: 'Schedule modified successfully',
      schedule: modifiedSchedule
    });
  } catch (error) {
    console.error('Error modifying schedule:', error);
    res.status(500).json({ error: 'Failed to modify schedule' });
  }
});

// Update schedule status (draft/published)
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await admin.firestore()
      .collection('schedules')
      .doc(req.params.id)
      .update({
        status,
        ...(status === 'published' && {
          publishedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      });

    res.json({ message: 'Schedule status updated successfully' });
  } catch (error) {
    console.error('Error updating schedule status:', error);
    res.status(500).json({ error: 'Failed to update schedule status' });
  }
});

// Delete schedule
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('schedules').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const schedule = doc.data();
    
    // Don't allow deleting published schedules
    if (schedule.status === 'published') {
      return res.status(400).json({ 
        error: 'Cannot delete published schedules' 
      });
    }

    await admin.firestore().collection('schedules').doc(req.params.id).delete();
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

module.exports = router;
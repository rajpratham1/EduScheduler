const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');

// Get all classrooms
router.get('/', verifyToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('classrooms').get();
    const classrooms = [];
    snapshot.forEach(doc => {
      classrooms.push({ id: doc.id, ...doc.data() });
    });
    res.json(classrooms);
  } catch (error) {
    console.error('Error getting classrooms:', error);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

// Get classroom by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('classrooms').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting classroom:', error);
    res.status(500).json({ error: 'Failed to fetch classroom' });
  }
});

// Create new classroom
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      building,
      floor,
      roomNumber,
      capacity,
      type,
      facilities,
      isLab,
      department
    } = req.body;

    const classroomData = {
      name,
      building,
      floor,
      roomNumber,
      capacity,
      type,
      facilities: facilities || [],
      isLab,
      department,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await admin.firestore().collection('classrooms').add(classroomData);
    
    res.status(201).json({ 
      message: 'Classroom created successfully', 
      id: docRef.id,
      ...classroomData
    });
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(500).json({ error: 'Failed to create classroom' });
  }
});

// Update classroom
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      building,
      floor,
      roomNumber,
      capacity,
      type,
      facilities,
      isLab,
      department
    } = req.body;

    const classroomRef = admin.firestore().collection('classrooms').doc(req.params.id);
    
    await classroomRef.update({
      name,
      building,
      floor,
      roomNumber,
      capacity,
      type,
      facilities: facilities || [],
      isLab,
      department,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Classroom updated successfully' });
  } catch (error) {
    console.error('Error updating classroom:', error);
    res.status(500).json({ error: 'Failed to update classroom' });
  }
});

// Delete classroom
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Check if classroom is being used in any current schedules
    const scheduleSnapshot = await admin.firestore()
      .collection('schedules')
      .where('classroom', '==', req.params.id)
      .limit(1)
      .get();

    if (!scheduleSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Cannot delete classroom that is being used in schedules' 
      });
    }

    await admin.firestore().collection('classrooms').doc(req.params.id).delete();
    res.json({ message: 'Classroom deleted successfully' });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    res.status(500).json({ error: 'Failed to delete classroom' });
  }
});

// Get classroom availability
router.get('/:id/availability', verifyToken, async (req, res) => {
  try {
    const { date } = req.query;
    
    // Get all schedules for this classroom on the specified date
    const scheduleSnapshot = await admin.firestore()
      .collection('schedules')
      .where('classroom', '==', req.params.id)
      .where('date', '==', date)
      .get();

    const timeSlots = [];
    scheduleSnapshot.forEach(doc => {
      const schedule = doc.data();
      timeSlots.push({
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        subject: schedule.subject,
        faculty: schedule.faculty
      });
    });

    res.json({
      date,
      timeSlots: timeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))
    });
  } catch (error) {
    console.error('Error getting classroom availability:', error);
    res.status(500).json({ error: 'Failed to fetch classroom availability' });
  }
});

// Bulk import classrooms
router.post('/bulk-import', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { classrooms } = req.body;
    const batch = admin.firestore().batch();
    
    classrooms.forEach(classroom => {
      const docRef = admin.firestore().collection('classrooms').doc();
      batch.set(docRef, {
        ...classroom,
        facilities: classroom.facilities || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    
    res.status(201).json({ 
      message: `Successfully imported ${classrooms.length} classrooms`
    });
  } catch (error) {
    console.error('Error bulk importing classrooms:', error);
    res.status(500).json({ error: 'Failed to import classrooms' });
  }
});

module.exports = router;
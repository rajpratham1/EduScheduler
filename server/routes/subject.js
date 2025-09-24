const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');

// Get all subjects for the logged-in admin
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { department } = req.query;
    
    let query = admin.firestore()
      .collection('subjects')
      .where('adminId', '==', adminId);
    
    if (department) {
      query = query.where('department', '==', department);
    }
    
    const snapshot = await query.orderBy('name').get();
    const subjects = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get enrollment count for this subject
      const enrollmentSnapshot = await admin.firestore()
        .collection('students')
        .where('adminId', '==', adminId)
        .where('currentSubjects', 'array-contains', doc.id)
        .get();
      
      // Get faculty assigned to this subject
      const facultySnapshot = await admin.firestore()
        .collection('faculty')
        .where('adminId', '==', adminId)
        .where('subjects', 'array-contains', doc.id)
        .get();
      
      subjects.push({
        id: doc.id,
        ...data,
        enrolledStudents: enrollmentSnapshot.size,
        assignedFaculty: facultySnapshot.size,
        createdAt: data.createdAt?.toDate()
      });
    }
    
    res.json(subjects);
  } catch (error) {
    console.error('Error getting subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get subjects by department
router.get('/department/:deptId', verifyToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('subjects')
      .where('department', '==', req.params.deptId)
      .get();
    
    const subjects = [];
    snapshot.forEach(doc => {
      subjects.push({ id: doc.id, ...doc.data() });
    });
    res.json(subjects);
  } catch (error) {
    console.error('Error getting subjects by department:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get subject by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('subjects').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting subject:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// Create new subject
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      code,
      department,
      semester,
      credits,
      description,
      hoursPerWeek,
      requiresLab,
      prerequisites
    } = req.body;

    const subjectData = {
      name,
      code,
      department,
      semester,
      credits,
      description,
      hoursPerWeek,
      requiresLab,
      prerequisites: prerequisites || [],
      adminId: req.user.uid, // Link subject to the admin who created it
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await admin.firestore().collection('subjects').add(subjectData);
    
    res.status(201).json({ 
      message: 'Subject created successfully', 
      id: docRef.id,
      ...subjectData
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// Update subject
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      code,
      department,
      semester,
      credits,
      description,
      hoursPerWeek,
      requiresLab,
      prerequisites
    } = req.body;

    const subjectRef = admin.firestore().collection('subjects').doc(req.params.id);
    
    await subjectRef.update({
      name,
      code,
      department,
      semester,
      credits,
      description,
      hoursPerWeek,
      requiresLab,
      prerequisites: prerequisites || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// Delete subject
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Check if subject is assigned to any faculty
    const facultySnapshot = await admin.firestore()
      .collection('faculty')
      .where('subjects', 'array-contains', req.params.id)
      .limit(1)
      .get();

    if (!facultySnapshot.empty) {
      return res.status(400).json({ 
        error: 'Cannot delete subject that is assigned to faculty members' 
      });
    }

    // Check if subject is a prerequisite for other subjects
    const prerequisiteSnapshot = await admin.firestore()
      .collection('subjects')
      .where('prerequisites', 'array-contains', req.params.id)
      .limit(1)
      .get();

    if (!prerequisiteSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Cannot delete subject that is a prerequisite for other subjects' 
      });
    }

    await admin.firestore().collection('subjects').doc(req.params.id).delete();
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Bulk import subjects
router.post('/bulk-import', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { subjects } = req.body;
    const batch = admin.firestore().batch();
    
    subjects.forEach(subject => {
      const docRef = admin.firestore().collection('subjects').doc();
      batch.set(docRef, {
        ...subject,
        prerequisites: subject.prerequisites || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    
    res.status(201).json({ 
      message: `Successfully imported ${subjects.length} subjects`
    });
  } catch (error) {
    console.error('Error bulk importing subjects:', error);
    res.status(500).json({ error: 'Failed to import subjects' });
  }
});

module.exports = router;
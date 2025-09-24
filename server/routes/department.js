const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// Get all departments for the logged-in admin with statistics
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.uid;
    const snapshot = await admin.firestore()
      .collection('departments')
      .where('adminId', '==', adminId)
      .orderBy('name')
      .get();
      
    const departments = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get faculty count for this department
      const facultySnapshot = await admin.firestore()
        .collection('faculty')
        .where('adminId', '==', adminId)
        .where('department', '==', data.name)
        .get();
      
      // Get student count for this department
      const studentSnapshot = await admin.firestore()
        .collection('students')
        .where('adminId', '==', adminId)
        .where('department', '==', data.name)
        .get();
      
      // Get subject count for this department
      const subjectSnapshot = await admin.firestore()
        .collection('subjects')
        .where('adminId', '==', adminId)
        .where('department', '==', data.name)
        .get();
      
      departments.push({
        id: doc.id,
        ...data,
        facultyCount: facultySnapshot.size,
        studentCount: studentSnapshot.size,
        subjectCount: subjectSnapshot.size,
        createdAt: data.createdAt?.toDate()
      });
    }
    
    res.json(departments);
  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get department by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('departments').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Create new department
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { 
      name,
      code,
      headOfDepartment,
      description,
      maxStudentsPerClass,
      totalSemesters
    } = req.body;

    const departmentData = {
      name,
      code,
      headOfDepartment,
      description,
      maxStudentsPerClass,
      totalSemesters,
      adminId: req.user.uid, // Link department to the admin who created it
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await admin.firestore().collection('departments').add(departmentData);
    
    res.status(201).json({ 
      message: 'Department created successfully', 
      id: docRef.id,
      ...departmentData
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update department
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      code,
      headOfDepartment,
      description,
      maxStudentsPerClass,
      totalSemesters
    } = req.body;

    const departmentRef = admin.firestore().collection('departments').doc(req.params.id);
    
    await departmentRef.update({
      name,
      code,
      headOfDepartment,
      description,
      maxStudentsPerClass,
      totalSemesters,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete department
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Check if department has associated students
    const studentsSnapshot = await admin.firestore()
      .collection('students')
      .where('department', '==', req.params.id)
      .limit(1)
      .get();

    if (!studentsSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Cannot delete department with associated students' 
      });
    }

    // Check if department has associated faculty
    const facultySnapshot = await admin.firestore()
      .collection('faculty')
      .where('department', '==', req.params.id)
      .limit(1)
      .get();

    if (!facultySnapshot.empty) {
      return res.status(400).json({ 
        error: 'Cannot delete department with associated faculty members' 
      });
    }

    await admin.firestore().collection('departments').doc(req.params.id).delete();
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// Get department statistics
router.get('/:id/statistics', verifyToken, async (req, res) => {
  try {
    const departmentId = req.params.id;

    // Get student count
    const studentsSnapshot = await admin.firestore()
      .collection('students')
      .where('department', '==', departmentId)
      .get();

    // Get faculty count
    const facultySnapshot = await admin.firestore()
      .collection('faculty')
      .where('department', '==', departmentId)
      .get();

    // Get subjects count
    const subjectsSnapshot = await admin.firestore()
      .collection('subjects')
      .where('department', '==', departmentId)
      .get();

    res.json({
      studentCount: studentsSnapshot.size,
      facultyCount: facultySnapshot.size,
      subjectCount: subjectsSnapshot.size
    });
  } catch (error) {
    console.error('Error getting department statistics:', error);
    res.status(500).json({ error: 'Failed to fetch department statistics' });
  }
});

module.exports = router;
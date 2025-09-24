const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');

// Get all faculty members
router.get('/', verifyToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('faculty').get();
    const faculty = [];
    snapshot.forEach(doc => {
      faculty.push({ id: doc.id, ...doc.data() });
    });
    res.json(faculty);
  } catch (error) {
    console.error('Error getting faculty:', error);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// Get faculty member by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('faculty').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Faculty member not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting faculty member:', error);
    res.status(500).json({ error: 'Failed to fetch faculty member' });
  }
});

// Create new faculty member
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, department, subjects, designation } = req.body;
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Set custom claims for faculty role
    await admin.auth().setCustomUserClaims(userRecord.uid, { faculty: true });

    // Store additional faculty data in Firestore
    await admin.firestore().collection('faculty').doc(userRecord.uid).set({
      name,
      email,
      department,
      subjects,
      designation,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ message: 'Faculty member created successfully', uid: userRecord.uid });
  } catch (error) {
    console.error('Error creating faculty member:', error);
    res.status(500).json({ error: 'Failed to create faculty member' });
  }
});

// Update faculty member
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, department, subjects, designation } = req.body;
    const facultyRef = admin.firestore().collection('faculty').doc(req.params.id);
    
    await facultyRef.update({
      name,
      department,
      subjects,
      designation,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Faculty member updated successfully' });
  } catch (error) {
    console.error('Error updating faculty member:', error);
    res.status(500).json({ error: 'Failed to update faculty member' });
  }
});

// Delete faculty member
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Delete from Firebase Auth
    await admin.auth().deleteUser(req.params.id);
    
    // Delete from Firestore
    await admin.firestore().collection('faculty').doc(req.params.id).delete();
    
    res.json({ message: 'Faculty member deleted successfully' });
  } catch (error) {
    console.error('Error deleting faculty member:', error);
    res.status(500).json({ error: 'Failed to delete faculty member' });
  }
});

module.exports = router;
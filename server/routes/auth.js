const express = require('express');
const router = express.Router();
const { admin } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// Admin Signup
router.post('/admin/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate Gmail address
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'Only Gmail addresses are allowed' });
    }

    // Check if admin already exists
    const adminsSnapshot = await admin.firestore()
      .collection('admins')
      .where('email', '==', email)
      .get();

    if (!adminsSnapshot.empty) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    // Generate unique secret code
    const secretCode = 'ADMIN' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Set custom claims for admin role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

    // Create admin profile in Firestore
    await admin.firestore().collection('admins').doc(userRecord.uid).set({
      name,
      email,
      role: 'admin',
      secretCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      createdBy: 'self'
    });

    // Create a default admin code for student registrations
    const defaultCodeData = {
      code: secretCode,
      name: 'Default Student Registration Code',
      description: 'Default code for student registrations',
      adminId: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: null,
      maxUses: null,
      currentUses: 0,
      isActive: true,
      usedBy: []
    };

    await admin.firestore().collection('admin_codes').add(defaultCodeData);

    res.status(201).json({ 
      message: 'Admin account created successfully',
      secretCode,
      uid: userRecord.uid
    });
  } catch (error) {
    console.error('Error in admin signup:', error);
    
    // More detailed error messages
    if (error.code === 'auth/email-already-in-use') {
      return res.status(400).json({ error: 'Email address is already in use' });
    } else if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email address format' });
    } else if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password should be at least 6 characters' });
    }
    
    res.status(500).json({ error: 'Failed to create admin account' });
  }
});

// Faculty Signup (Only by Admin)
router.post('/faculty/signup', verifyToken, async (req, res) => {
  try {
    const { email, password, name, department, adminId, secretCode } = req.body;

    // Validate request
    if (!email || !password || !name || !department || !adminId || !secretCode) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify admin exists and secret code is valid
    const adminDoc = await admin.firestore().collection('admins').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data().secretCode !== secretCode) {
      return res.status(403).json({ error: 'Invalid admin credentials' });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Set custom claims for faculty role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'faculty' });

    // Create faculty profile in Firestore
    await admin.firestore().collection('faculty').doc(userRecord.uid).set({
      name,
      email,
      department,
      role: 'faculty',
      adminId,
      secretCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      needsPasswordChange: true
    });

    res.status(201).json({
      message: 'Faculty account created successfully',
      uid: userRecord.uid
    });
  } catch (error) {
    console.error('Error in faculty signup:', error);
    res.status(500).json({ error: 'Failed to create faculty account' });
  }
});

// Password Reset Request
router.post('/password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    // Generate password reset link
    const link = await admin.auth().generatePasswordResetLink(email);

    res.json({ 
      message: 'Password reset link sent successfully',
      link // In production, you would send this link via email
    });
  } catch (error) {
    console.error('Error in password reset:', error);
    res.status(500).json({ error: 'Failed to send password reset link' });
  }
});

// Verify Admin Token
router.post('/verify-admin', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const adminDoc = await admin.firestore().collection('admins').doc(uid).get();

    if (!adminDoc.exists) {
      return res.status(403).json({ error: 'Not an admin' });
    }

    const adminData = adminDoc.data();
    if (!adminData.isActive) {
      return res.status(403).json({ error: 'Admin account is deactivated' });
    }

    res.json({
      message: 'Valid admin token',
      admin: {
        id: adminDoc.id,
        ...adminData
      }
    });
  } catch (error) {
    console.error('Error verifying admin token:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// Verify Faculty Token
router.post('/verify-faculty', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const facultyDoc = await admin.firestore().collection('faculty').doc(uid).get();

    if (!facultyDoc.exists) {
      return res.status(403).json({ error: 'Not a faculty member' });
    }

    const facultyData = facultyDoc.data();
    if (!facultyData.isActive) {
      return res.status(403).json({ error: 'Faculty account is deactivated' });
    }

    res.json({
      message: 'Valid faculty token',
      faculty: {
        id: facultyDoc.id,
        ...facultyData
      }
    });
  } catch (error) {
    console.error('Error verifying faculty token:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// Update Password
router.post('/update-password', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { newPassword } = req.body;

    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    // If it's a faculty member, update the needsPasswordChange flag
    const facultyDoc = await admin.firestore().collection('faculty').doc(uid).get();
    if (facultyDoc.exists) {
      await admin.firestore().collection('faculty').doc(uid).update({
        needsPasswordChange: false
      });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
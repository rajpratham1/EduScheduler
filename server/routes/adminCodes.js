const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// Generate new admin code
router.post('/generate', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description = '',
      expiresAt = null,
      maxUses = null,
      isActive = true
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Code name is required' });
    }

    // Generate unique code
    const code = generateUniqueCode();
    
    const codeData = {
      code,
      name,
      description,
      adminId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxUses: maxUses || null,
      currentUses: 0,
      isActive,
      usedBy: [] // Array of student IDs who used this code
    };

    const docRef = await admin.firestore().collection('admin_codes').add(codeData);

    res.status(201).json({
      message: 'Admin code generated successfully',
      id: docRef.id,
      code,
      ...codeData
    });
  } catch (error) {
    console.error('Error generating admin code:', error);
    res.status(500).json({ error: 'Failed to generate admin code' });
  }
});

// Get all admin codes for current admin
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { active, expired } = req.query;
    
    let query = admin.firestore()
      .collection('admin_codes')
      .where('adminId', '==', req.user.uid);

    if (active !== undefined) {
      query = query.where('isActive', '==', active === 'true');
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const codes = [];
    const now = new Date();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const isExpired = data.expiresAt && now > data.expiresAt.toDate();
      const isMaxUsesReached = data.maxUses && data.currentUses >= data.maxUses;
      
      // Filter by expired status if requested
      if (expired !== undefined) {
        const shouldInclude = expired === 'true' ? isExpired : !isExpired;
        if (!shouldInclude) return;
      }

      codes.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
        isExpired,
        isMaxUsesReached,
        canUse: data.isActive && !isExpired && !isMaxUsesReached
      });
    });

    res.json(codes);
  } catch (error) {
    console.error('Error fetching admin codes:', error);
    res.status(500).json({ error: 'Failed to fetch admin codes' });
  }
});

// Verify admin code (used during student signup)
router.post('/verify', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Admin code is required' });
    }

    const snapshot = await admin.firestore()
      .collection('admin_codes')
      .where('code', '==', code.toUpperCase())
      .where('isActive', '==', true)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Invalid admin code' });
    }

    const codeDoc = snapshot.docs[0];
    const codeData = codeDoc.data();
    const now = new Date();

    // Check if code has expired
    if (codeData.expiresAt && now > codeData.expiresAt.toDate()) {
      return res.status(400).json({ error: 'Admin code has expired' });
    }

    // Check if max uses reached
    if (codeData.maxUses && codeData.currentUses >= codeData.maxUses) {
      return res.status(400).json({ error: 'Admin code usage limit reached' });
    }

    // Get admin details
    const adminDoc = await admin.firestore()
      .collection('admins')
      .doc(codeData.adminId)
      .get();

    if (!adminDoc.exists) {
      return res.status(404).json({ error: 'Associated admin not found' });
    }

    res.json({
      valid: true,
      codeId: codeDoc.id,
      adminId: codeData.adminId,
      adminName: adminDoc.data().name,
      institutionName: adminDoc.data().institutionName || 'Unknown Institution',
      codeDescription: codeData.description
    });
  } catch (error) {
    console.error('Error verifying admin code:', error);
    res.status(500).json({ error: 'Failed to verify admin code' });
  }
});

// Use admin code (increment usage count)
router.post('/use/:codeId', async (req, res) => {
  try {
    const { codeId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const codeDoc = await admin.firestore()
      .collection('admin_codes')
      .doc(codeId)
      .get();

    if (!codeDoc.exists) {
      return res.status(404).json({ error: 'Admin code not found' });
    }

    const codeData = codeDoc.data();

    // Check if student already used this code
    if (codeData.usedBy && codeData.usedBy.includes(studentId)) {
      return res.status(409).json({ error: 'Student has already used this code' });
    }

    // Update code usage
    await admin.firestore()
      .collection('admin_codes')
      .doc(codeId)
      .update({
        currentUses: admin.firestore.FieldValue.increment(1),
        usedBy: admin.firestore.FieldValue.arrayUnion(studentId),
        lastUsedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ message: 'Admin code used successfully' });
  } catch (error) {
    console.error('Error using admin code:', error);
    res.status(500).json({ error: 'Failed to use admin code' });
  }
});

// Update admin code
router.put('/:codeId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { codeId } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated
    delete updateData.code;
    delete updateData.adminId;
    delete updateData.createdAt;
    delete updateData.currentUses;
    delete updateData.usedBy;

    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const codeDoc = await admin.firestore()
      .collection('admin_codes')
      .doc(codeId)
      .get();

    if (!codeDoc.exists) {
      return res.status(404).json({ error: 'Admin code not found' });
    }

    // Check if current user owns this code
    if (codeDoc.data().adminId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await admin.firestore()
      .collection('admin_codes')
      .doc(codeId)
      .update(updateData);

    res.json({ message: 'Admin code updated successfully' });
  } catch (error) {
    console.error('Error updating admin code:', error);
    res.status(500).json({ error: 'Failed to update admin code' });
  }
});

// Delete admin code
router.delete('/:codeId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { codeId } = req.params;

    const codeDoc = await admin.firestore()
      .collection('admin_codes')
      .doc(codeId)
      .get();

    if (!codeDoc.exists) {
      return res.status(404).json({ error: 'Admin code not found' });
    }

    // Check if current user owns this code
    if (codeDoc.data().adminId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await admin.firestore()
      .collection('admin_codes')
      .doc(codeId)
      .delete();

    res.json({ message: 'Admin code deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin code:', error);
    res.status(500).json({ error: 'Failed to delete admin code' });
  }
});

// Get admin code usage statistics
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('admin_codes')
      .where('adminId', '==', req.user.uid)
      .get();

    let totalCodes = 0;
    let activeCodes = 0;
    let expiredCodes = 0;
    let totalUses = 0;
    let codesWithMaxUses = 0;

    const now = new Date();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalCodes++;
      totalUses += data.currentUses || 0;

      if (data.maxUses) {
        codesWithMaxUses++;
      }

      const isExpired = data.expiresAt && now > data.expiresAt.toDate();
      const isMaxUsesReached = data.maxUses && data.currentUses >= data.maxUses;

      if (data.isActive && !isExpired && !isMaxUsesReached) {
        activeCodes++;
      } else if (isExpired) {
        expiredCodes++;
      }
    });

    res.json({
      totalCodes,
      activeCodes,
      expiredCodes,
      inactiveCodes: totalCodes - activeCodes - expiredCodes,
      totalUses,
      averageUsesPerCode: totalCodes > 0 ? Math.round(totalUses / totalCodes * 100) / 100 : 0,
      codesWithMaxUses
    });
  } catch (error) {
    console.error('Error fetching admin code stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Helper function to generate unique code
function generateUniqueCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

module.exports = router;
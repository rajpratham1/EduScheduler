const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');

// Create announcement (Faculty/Admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user is faculty or admin
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      title,
      content,
      priority = 'normal', // 'low', 'normal', 'high', 'urgent'
      targetAudience = 'all', // 'all', 'students', 'faculty', 'class', 'department'
      classIds = [],
      departmentIds = [],
      expiryDate,
      pinned = false,
      attachments = []
    } = req.body;

    const announcementData = {
      title,
      content,
      priority,
      targetAudience,
      classIds: targetAudience === 'class' ? classIds : [],
      departmentIds: targetAudience === 'department' ? departmentIds : [],
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      pinned,
      attachments,
      authorId: req.user.uid,
      authorRole: req.user.role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      views: 0,
      readBy: []
    };

    const docRef = await admin.firestore().collection('announcements').add(announcementData);
    
    // If it's urgent, we could trigger push notifications here
    if (priority === 'urgent') {
      // TODO: Implement push notification logic
      console.log('Urgent announcement created:', docRef.id);
    }
    
    res.status(201).json({
      message: 'Announcement created successfully',
      id: docRef.id,
      ...announcementData
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Get announcements for students
router.get('/student', verifyToken, async (req, res) => {
  try {
    // Verify user is a student
    const studentDoc = await admin.firestore().collection('students').doc(req.user.uid).get();
    if (!studentDoc.exists || !studentDoc.data().isActive) {
      return res.status(403).json({ error: 'Access denied or account inactive' });
    }

    const studentData = studentDoc.data();
    const { page = 1, limit = 20, priority } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get announcements that apply to this student
    let query = admin.firestore()
      .collection('announcements')
      .where('isActive', '==', true);

    if (priority) {
      query = query.where('priority', '==', priority);
    }

    const snapshot = await query
      .orderBy('pinned', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(offset)
      .get();

    const announcements = [];
    const now = new Date();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Check if announcement has expired
      if (data.expiryDate && now > data.expiryDate.toDate()) continue;
      
      // Check if announcement applies to this student
      let applies = false;
      
      if (data.targetAudience === 'all' || data.targetAudience === 'students') {
        applies = true;
      } else if (data.targetAudience === 'class') {
        applies = data.classIds.includes(studentData.classId);
      } else if (data.targetAudience === 'department') {
        applies = data.departmentIds.includes(studentData.department);
      }
      
      if (applies) {
        // Get author details
        let authorInfo = { name: 'Unknown', role: 'unknown' };
        
        if (data.authorRole === 'admin') {
          const authorDoc = await admin.firestore()
            .collection('admins')
            .doc(data.authorId)
            .get();
          if (authorDoc.exists) {
            authorInfo = { name: authorDoc.data().name, role: 'admin' };
          }
        } else if (data.authorRole === 'faculty') {
          const authorDoc = await admin.firestore()
            .collection('faculty')
            .doc(data.authorId)
            .get();
          if (authorDoc.exists) {
            authorInfo = { name: authorDoc.data().name, role: 'faculty' };
          }
        }
        
        // Check if student has read this announcement
        const hasRead = data.readBy.includes(req.user.uid);
        
        announcements.push({
          id: doc.id,
          ...data,
          author: authorInfo,
          hasRead,
          createdAt: data.createdAt?.toDate(),
          expiryDate: data.expiryDate?.toDate()
        });
      }
    }

    res.json({
      announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: announcements.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching student announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get announcements for faculty
router.get('/faculty', verifyToken, async (req, res) => {
  try {
    // Verify user is a faculty member
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied. Faculty only.' });
    }

    const { page = 1, limit = 20, priority, own = false } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = admin.firestore()
      .collection('announcements')
      .where('isActive', '==', true);

    if (own === 'true') {
      query = query.where('authorId', '==', req.user.uid);
    } else {
      // Show announcements targeted at faculty or all
      query = query.where('targetAudience', 'in', ['all', 'faculty']);
    }

    if (priority) {
      query = query.where('priority', '==', priority);
    }

    const snapshot = await query
      .orderBy('pinned', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(offset)
      .get();

    const announcements = [];
    const now = new Date();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Check if announcement has expired (unless it's own announcements)
      if (own !== 'true' && data.expiryDate && now > data.expiryDate.toDate()) continue;
      
      // Get author details
      let authorInfo = { name: 'Unknown', role: 'unknown' };
      
      if (data.authorRole === 'admin') {
        const authorDoc = await admin.firestore()
          .collection('admins')
          .doc(data.authorId)
          .get();
        if (authorDoc.exists) {
          authorInfo = { name: authorDoc.data().name, role: 'admin' };
        }
      } else if (data.authorRole === 'faculty') {
        const authorDoc = await admin.firestore()
          .collection('faculty')
          .doc(data.authorId)
          .get();
        if (authorDoc.exists) {
          authorInfo = { name: authorDoc.data().name, role: 'faculty' };
        }
      }
      
      announcements.push({
        id: doc.id,
        ...data,
        author: authorInfo,
        createdAt: data.createdAt?.toDate(),
        expiryDate: data.expiryDate?.toDate(),
        canEdit: data.authorId === req.user.uid || req.user.role === 'admin'
      });
    }

    res.json({
      announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: announcements.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching faculty announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get announcements for admin
router.get('/admin', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, priority, authorRole, targetAudience } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = admin.firestore().collection('announcements');

    if (priority) {
      query = query.where('priority', '==', priority);
    }

    if (authorRole) {
      query = query.where('authorRole', '==', authorRole);
    }

    if (targetAudience) {
      query = query.where('targetAudience', '==', targetAudience);
    }

    const snapshot = await query
      .orderBy('pinned', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(offset)
      .get();

    const announcements = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get author details
      let authorInfo = { name: 'Unknown', role: 'unknown' };
      
      if (data.authorRole === 'admin') {
        const authorDoc = await admin.firestore()
          .collection('admins')
          .doc(data.authorId)
          .get();
        if (authorDoc.exists) {
          authorInfo = { name: authorDoc.data().name, role: 'admin' };
        }
      } else if (data.authorRole === 'faculty') {
        const authorDoc = await admin.firestore()
          .collection('faculty')
          .doc(data.authorId)
          .get();
        if (authorDoc.exists) {
          authorInfo = { name: authorDoc.data().name, role: 'faculty' };
        }
      }
      
      announcements.push({
        id: doc.id,
        ...data,
        author: authorInfo,
        createdAt: data.createdAt?.toDate(),
        expiryDate: data.expiryDate?.toDate()
      });
    }

    res.json({
      announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: announcements.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get specific announcement
router.get('/:announcementId', verifyToken, async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    const announcementDoc = await admin.firestore()
      .collection('announcements')
      .doc(announcementId)
      .get();
    
    if (!announcementDoc.exists) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    const data = announcementDoc.data();
    
    // Get author details
    let authorInfo = { name: 'Unknown', role: 'unknown' };
    
    if (data.authorRole === 'admin') {
      const authorDoc = await admin.firestore()
        .collection('admins')
        .doc(data.authorId)
        .get();
      if (authorDoc.exists) {
        authorInfo = { name: authorDoc.data().name, role: 'admin' };
      }
    } else if (data.authorRole === 'faculty') {
      const authorDoc = await admin.firestore()
        .collection('faculty')
        .doc(data.authorId)
        .get();
      if (authorDoc.exists) {
        authorInfo = { name: authorDoc.data().name, role: 'faculty' };
      }
    }
    
    // Increment view count
    await admin.firestore()
      .collection('announcements')
      .doc(announcementId)
      .update({
        views: admin.firestore.FieldValue.increment(1)
      });
    
    res.json({
      id: announcementDoc.id,
      ...data,
      author: authorInfo,
      createdAt: data.createdAt?.toDate(),
      expiryDate: data.expiryDate?.toDate(),
      canEdit: data.authorId === req.user.uid || req.user.role === 'admin'
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// Mark announcement as read (Student only)
router.post('/:announcementId/read', verifyToken, async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    // Verify user is a student
    const studentDoc = await admin.firestore().collection('students').doc(req.user.uid).get();
    if (!studentDoc.exists || !studentDoc.data().isActive) {
      return res.status(403).json({ error: 'Access denied or account inactive' });
    }
    
    await admin.firestore()
      .collection('announcements')
      .doc(announcementId)
      .update({
        readBy: admin.firestore.FieldValue.arrayUnion(req.user.uid)
      });
    
    res.json({ message: 'Announcement marked as read' });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({ error: 'Failed to mark announcement as read' });
  }
});

// Update announcement
router.put('/:announcementId', verifyToken, async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    const announcementDoc = await admin.firestore()
      .collection('announcements')
      .doc(announcementId)
      .get();
    
    if (!announcementDoc.exists) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    const data = announcementDoc.data();
    
    // Check permissions
    if (data.authorId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updateData = { ...req.body };
    delete updateData.authorId;
    delete updateData.authorRole;
    delete updateData.createdAt;
    delete updateData.views;
    delete updateData.readBy;
    
    if (updateData.expiryDate) {
      updateData.expiryDate = new Date(updateData.expiryDate);
    }
    
    if (updateData.targetAudience === 'class') {
      updateData.departmentIds = [];
    } else if (updateData.targetAudience === 'department') {
      updateData.classIds = [];
    } else {
      updateData.classIds = [];
      updateData.departmentIds = [];
    }
    
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    updateData.updatedBy = req.user.uid;
    
    await admin.firestore()
      .collection('announcements')
      .doc(announcementId)
      .update(updateData);
    
    res.json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement
router.delete('/:announcementId', verifyToken, async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    const announcementDoc = await admin.firestore()
      .collection('announcements')
      .doc(announcementId)
      .get();
    
    if (!announcementDoc.exists) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    const data = announcementDoc.data();
    
    // Check permissions
    if (data.authorId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await admin.firestore()
      .collection('announcements')
      .doc(announcementId)
      .delete();
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// Toggle announcement pin status
router.patch('/:announcementId/pin', verifyToken, async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    const announcementDoc = await admin.firestore()
      .collection('announcements')
      .doc(announcementId)
      .get();
    
    if (!announcementDoc.exists) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    const data = announcementDoc.data();
    
    // Check permissions
    if (data.authorId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const newPinnedStatus = !data.pinned;
    
    await admin.firestore()
      .collection('announcements')
      .doc(announcementId)
      .update({
        pinned: newPinnedStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.user.uid
      });
    
    res.json({ 
      message: `Announcement ${newPinnedStatus ? 'pinned' : 'unpinned'} successfully`,
      pinned: newPinnedStatus
    });
  } catch (error) {
    console.error('Error toggling pin status:', error);
    res.status(500).json({ error: 'Failed to toggle pin status' });
  }
});

// Get announcement analytics (Admin only)
router.get('/admin/analytics', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = admin.firestore().collection('announcements');
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      query = query
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end);
    }
    
    const snapshot = await query.get();
    const announcements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    
    // Analytics calculations
    const totalAnnouncements = announcements.length;
    const activeAnnouncements = announcements.filter(a => a.isActive).length;
    const pinnedAnnouncements = announcements.filter(a => a.pinned).length;
    
    // Priority distribution
    const priorityStats = {
      low: announcements.filter(a => a.priority === 'low').length,
      normal: announcements.filter(a => a.priority === 'normal').length,
      high: announcements.filter(a => a.priority === 'high').length,
      urgent: announcements.filter(a => a.priority === 'urgent').length
    };
    
    // Author role distribution
    const authorRoleStats = {
      admin: announcements.filter(a => a.authorRole === 'admin').length,
      faculty: announcements.filter(a => a.authorRole === 'faculty').length
    };
    
    // Target audience distribution
    const audienceStats = {
      all: announcements.filter(a => a.targetAudience === 'all').length,
      students: announcements.filter(a => a.targetAudience === 'students').length,
      faculty: announcements.filter(a => a.targetAudience === 'faculty').length,
      class: announcements.filter(a => a.targetAudience === 'class').length,
      department: announcements.filter(a => a.targetAudience === 'department').length
    };
    
    // Engagement stats
    const totalViews = announcements.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalReads = announcements.reduce((sum, a) => sum + (a.readBy?.length || 0), 0);
    const averageViews = totalAnnouncements > 0 ? Math.round(totalViews / totalAnnouncements) : 0;
    
    // Most viewed announcements
    const topAnnouncements = announcements
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        title: a.title,
        views: a.views || 0,
        reads: a.readBy?.length || 0,
        priority: a.priority
      }));
    
    res.json({
      overview: {
        totalAnnouncements,
        activeAnnouncements,
        pinnedAnnouncements,
        totalViews,
        totalReads,
        averageViews
      },
      distribution: {
        priority: priorityStats,
        authorRole: authorRoleStats,
        audience: audienceStats
      },
      topAnnouncements
    });
  } catch (error) {
    console.error('Error generating announcement analytics:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

module.exports = router;
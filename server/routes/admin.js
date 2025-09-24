const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// Get admin profile and dashboard statistics
router.get('/dashboard', verifyToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.uid;
    
    // Get admin profile
    const adminDoc = await admin.firestore().collection('admins').doc(adminId).get();
    if (!adminDoc.exists) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }

    // Get statistics
    const [facultySnapshot, studentSnapshot, departmentSnapshot, subjectSnapshot, classroomSnapshot, scheduleSnapshot] = await Promise.all([
      admin.firestore().collection('faculty').where('adminId', '==', adminId).get(),
      admin.firestore().collection('students').where('adminId', '==', adminId).get(),
      admin.firestore().collection('departments').where('adminId', '==', adminId).get(),
      admin.firestore().collection('subjects').where('adminId', '==', adminId).get(),
      admin.firestore().collection('classrooms').where('adminId', '==', adminId).get(),
      admin.firestore().collection('schedules').where('adminId', '==', adminId).get()
    ]);

    const stats = {
      faculty: facultySnapshot.size,
      students: studentSnapshot.size,
      departments: departmentSnapshot.size,
      subjects: subjectSnapshot.size,
      classrooms: classroomSnapshot.size,
      schedules: scheduleSnapshot.size,
      activeStudents: studentSnapshot.docs.filter(doc => doc.data().status === 'approved').length,
      pendingApprovals: await getPendingApprovalsCount(adminId)
    };

    res.json({
      profile: { id: adminDoc.id, ...adminDoc.data() },
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all admins (Super admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('admins').get();
    const admins = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      admins.push({
        id: doc.id,
        ...data,
        secretCode: data.secretCode, // Show for admin management
        createdAt: data.createdAt?.toDate()
      });
    });
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Get admin by ID
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('admins').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting admin:', error);
    res.status(500).json({ error: 'Failed to fetch admin' });
  }
});

// Create new admin
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Set custom claims for admin role
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    // Store additional admin data in Firestore
    await admin.firestore().collection('admins').doc(userRecord.uid).set({
      name,
      email,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ message: 'Admin created successfully', uid: userRecord.uid });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Update admin profile
router.put('/profile', verifyToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.uid;
    const {
      name,
      institutionName,
      institutionAddress,
      contactNumber,
      settings
    } = req.body;

    const updateData = {
      name,
      institutionName,
      institutionAddress,
      contactNumber,
      settings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('admins').doc(adminId).update(updateData);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get analytics data
router.get('/analytics', verifyToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { timeRange = '30' } = req.query;
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Student enrollment over time
    const studentSnapshot = await admin.firestore()
      .collection('students')
      .where('adminId', '==', adminId)
      .where('createdAt', '>=', startDate)
      .orderBy('createdAt')
      .get();

    const enrollmentData = {};
    studentSnapshot.docs.forEach(doc => {
      const date = doc.data().createdAt.toDate().toDateString();
      enrollmentData[date] = (enrollmentData[date] || 0) + 1;
    });

    // Department-wise statistics
    const departmentStats = await getDepartmentStats(adminId);
    
    // Attendance trends
    const attendanceStats = await getAttendanceStats(adminId, startDate);

    // Assignment completion rates
    const assignmentStats = await getAssignmentStats(adminId, startDate);

    res.json({
      enrollmentTrend: enrollmentData,
      departmentStats,
      attendanceStats,
      assignmentStats,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Update admin
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, role } = req.body;
    const adminRef = admin.firestore().collection('admins').doc(req.params.id);
    
    await adminRef.update({
      name,
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Admin updated successfully' });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

// Delete admin
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Delete from Firebase Auth
    await admin.auth().deleteUser(req.params.id);
    
    // Delete from Firestore
    await admin.firestore().collection('admins').doc(req.params.id).delete();
    
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// Helper functions
async function getPendingApprovalsCount(adminId) {
  try {
    const snapshot = await admin.firestore()
      .collection('student_signup_requests')
      .where('adminId', '==', adminId)
      .where('status', '==', 'pending')
      .get();
    return snapshot.size;
  } catch (error) {
    console.error('Error getting pending approvals count:', error);
    return 0;
  }
}

async function getDepartmentStats(adminId) {
  try {
    const snapshot = await admin.firestore()
      .collection('departments')
      .where('adminId', '==', adminId)
      .get();

    const stats = [];
    for (const doc of snapshot.docs) {
      const dept = doc.data();
      const studentCount = await admin.firestore()
        .collection('students')
        .where('adminId', '==', adminId)
        .where('department', '==', dept.name)
        .get();
      
      const facultyCount = await admin.firestore()
        .collection('faculty')
        .where('adminId', '==', adminId)
        .where('department', '==', dept.name)
        .get();

      stats.push({
        name: dept.name,
        students: studentCount.size,
        faculty: facultyCount.size
      });
    }
    return stats;
  } catch (error) {
    console.error('Error getting department stats:', error);
    return [];
  }
}

async function getAttendanceStats(adminId, startDate) {
  try {
    const snapshot = await admin.firestore()
      .collection('attendance')
      .where('adminId', '==', adminId)
      .where('date', '>=', startDate)
      .get();

    const stats = {
      totalClasses: snapshot.size,
      presentCount: 0,
      absentCount: 0
    };

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'present') stats.presentCount++;
      else stats.absentCount++;
    });

    stats.attendanceRate = stats.totalClasses > 0 ? 
      ((stats.presentCount / stats.totalClasses) * 100).toFixed(2) : 0;

    return stats;
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    return { totalClasses: 0, presentCount: 0, absentCount: 0, attendanceRate: 0 };
  }
}

async function getAssignmentStats(adminId, startDate) {
  try {
    const assignmentSnapshot = await admin.firestore()
      .collection('assignments')
      .where('adminId', '==', adminId)
      .where('createdAt', '>=', startDate)
      .get();

    const submissionSnapshot = await admin.firestore()
      .collection('assignment_submissions')
      .where('adminId', '==', adminId)
      .where('submittedAt', '>=', startDate)
      .get();

    return {
      totalAssignments: assignmentSnapshot.size,
      totalSubmissions: submissionSnapshot.size,
      averageSubmissionRate: assignmentSnapshot.size > 0 ? 
        ((submissionSnapshot.size / assignmentSnapshot.size) * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error getting assignment stats:', error);
    return { totalAssignments: 0, totalSubmissions: 0, averageSubmissionRate: 0 };
  }
}

module.exports = router;

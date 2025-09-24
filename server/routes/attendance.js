const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// Get all attendance records (Admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // Get admin's institution attendance records only
    const snapshot = await admin.firestore()
      .collection('attendance')
      .where('adminId', '==', req.user.uid)
      .orderBy('markedAt', 'desc')
      .limit(1000) // Limit for performance
      .get();

    const attendanceRecords = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get related details
      const [studentDoc, subjectDoc, facultyDoc] = await Promise.all([
        admin.firestore().collection('students').doc(data.studentId).get(),
        admin.firestore().collection('subjects').doc(data.subjectId).get(),
        admin.firestore().collection('faculty').doc(data.facultyId).get()
      ]);
      
      // Transform data to match frontend expectations
      attendanceRecords.push({
        id: doc.id,
        ...data,
        markedAt: data.markedAt?.toDate(),
        date: data.date,
        students: [
          {
            studentId: data.studentId,
            status: data.status || 'present'
          }
        ],
        student: studentDoc.exists ? {
          name: studentDoc.data().name,
          rollNumber: studentDoc.data().rollNumber
        } : null,
        subject: subjectDoc.exists ? subjectDoc.data().name : 'Unknown',
        faculty: facultyDoc.exists ? facultyDoc.data().name : 'Unknown'
      });
    }

    res.json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching all attendance records:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Generate QR code for attendance (Faculty only)
router.post('/generate-qr', verifyToken, async (req, res) => {
  try {
    // Verify user is a faculty member
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied. Faculty only.' });
    }

    const {
      classId,
      subjectId,
      date,
      startTime,
      endTime,
      duration = 300 // 5 minutes default
    } = req.body;

    const qrId = uuidv4();
    const expiresAt = new Date(Date.now() + duration * 1000); // Convert seconds to milliseconds

    const qrData = {
      qrId,
      classId,
      subjectId,
      facultyId: req.user.uid,
      date,
      startTime,
      endTime,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      studentsPresent: []
    };

    await admin.firestore().collection('qr_codes').doc(qrId).set(qrData);

    res.status(201).json({
      message: 'QR code generated successfully',
      qrId,
      expiresAt: expiresAt.toISOString(),
      qrData: {
        qrId,
        classId,
        subjectId,
        facultyId: req.user.uid,
        date,
        startTime,
        endTime
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Mark attendance via QR scan (Student only)
router.post('/mark/:qrId', verifyToken, async (req, res) => {
  try {
    const { qrId } = req.params;
    const studentId = req.user.uid;

    // Verify user is a student
    const studentDoc = await admin.firestore().collection('students').doc(studentId).get();
    if (!studentDoc.exists || !studentDoc.data().isActive) {
      return res.status(403).json({ error: 'Access denied or account inactive' });
    }

    // Get QR code data
    const qrDoc = await admin.firestore().collection('qr_codes').doc(qrId).get();
    if (!qrDoc.exists) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    const qrData = qrDoc.data();
    
    // Check if QR code is still active
    if (!qrData.isActive || new Date() > qrData.expiresAt.toDate()) {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    // Check if student already marked attendance for this session
    const existingAttendance = await admin.firestore()
      .collection('attendance')
      .where('qrId', '==', qrId)
      .where('studentId', '==', studentId)
      .get();

    if (!existingAttendance.empty) {
      return res.status(409).json({ error: 'Attendance already marked for this session' });
    }

    // Get student's adminId for data isolation
    const studentData = studentDoc.data();
    const adminId = studentData.adminId;

    // Create attendance record
    const attendanceData = {
      qrId,
      studentId,
      facultyId: qrData.facultyId,
      classId: qrData.classId,
      subjectId: qrData.subjectId,
      date: qrData.date,
      startTime: qrData.startTime,
      endTime: qrData.endTime,
      status: 'present',
      adminId: adminId,
      markedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const attendanceRef = await admin.firestore()
      .collection('attendance')
      .add(attendanceData);

    // Update QR code with student present
    await admin.firestore()
      .collection('qr_codes')
      .doc(qrId)
      .update({
        studentsPresent: admin.firestore.FieldValue.arrayUnion(studentId)
      });

    res.json({
      message: 'Attendance marked successfully',
      attendanceId: attendanceRef.id,
      markedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get attendance for a specific class/subject (Faculty/Admin)
router.get('/class/:classId/subject/:subjectId', verifyToken, async (req, res) => {
  try {
    const { classId, subjectId } = req.params;
    const { date, facultyId } = req.query;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'faculty' && facultyId && facultyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = admin.firestore()
      .collection('attendance')
      .where('classId', '==', classId)
      .where('subjectId', '==', subjectId);

    if (date) {
      query = query.where('date', '==', date);
    }

    if (facultyId) {
      query = query.where('facultyId', '==', facultyId);
    }

    const snapshot = await query.orderBy('markedAt', 'desc').get();
    const attendance = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get student details
      const studentDoc = await admin.firestore()
        .collection('students')
        .doc(data.studentId)
        .get();
      
      attendance.push({
        id: doc.id,
        ...data,
        student: studentDoc.exists ? {
          name: studentDoc.data().name,
          rollNumber: studentDoc.data().rollNumber
        } : null,
        markedAt: data.markedAt?.toDate()
      });
    }

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get student's attendance history (Student/Admin/Faculty)
router.get('/student/:studentId?', verifyToken, async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user.uid;
    
    // Check permissions
    if (studentId !== req.user.uid && req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const snapshot = await admin.firestore()
      .collection('attendance')
      .where('studentId', '==', studentId)
      .orderBy('markedAt', 'desc')
      .get();

    const attendance = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get subject and faculty details
      const [subjectDoc, facultyDoc] = await Promise.all([
        admin.firestore().collection('subjects').doc(data.subjectId).get(),
        admin.firestore().collection('faculty').doc(data.facultyId).get()
      ]);
      
      attendance.push({
        id: doc.id,
        ...data,
        subject: subjectDoc.exists ? subjectDoc.data().name : 'Unknown',
        faculty: facultyDoc.exists ? facultyDoc.data().name : 'Unknown',
        markedAt: data.markedAt?.toDate()
      });
    }

    // Calculate attendance statistics
    const totalClasses = attendance.length;
    const subjectStats = {};
    
    attendance.forEach(record => {
      if (!subjectStats[record.subjectId]) {
        subjectStats[record.subjectId] = {
          subject: record.subject,
          total: 0,
          present: 0
        };
      }
      subjectStats[record.subjectId].total++;
      if (record.status === 'present') {
        subjectStats[record.subjectId].present++;
      }
    });

    // Calculate percentages
    Object.keys(subjectStats).forEach(subjectId => {
      const stats = subjectStats[subjectId];
      stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
    });

    res.json({
      attendance,
      statistics: {
        totalClasses,
        presentClasses: attendance.filter(a => a.status === 'present').length,
        overallPercentage: totalClasses > 0 ? 
          Math.round((attendance.filter(a => a.status === 'present').length / totalClasses) * 100) : 0,
        subjectWise: subjectStats
      }
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Manual attendance marking (Faculty only)
router.post('/manual', verifyToken, async (req, res) => {
  try {
    // Verify user is a faculty member
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied. Faculty only.' });
    }

    const {
      students, // Array of { studentId, status }
      classId,
      subjectId,
      date,
      startTime,
      endTime
    } = req.body;

    const batch = admin.firestore().batch();
    const attendanceRecords = [];

    for (const student of students) {
      const attendanceData = {
        studentId: student.studentId,
        facultyId: req.user.uid,
        classId,
        subjectId,
        date,
        startTime,
        endTime,
        status: student.status || 'present',
        markedAt: admin.firestore.FieldValue.serverTimestamp(),
        markedManually: true
      };

      const docRef = admin.firestore().collection('attendance').doc();
      batch.set(docRef, attendanceData);
      
      attendanceRecords.push({
        id: docRef.id,
        ...attendanceData
      });
    }

    await batch.commit();

    res.status(201).json({
      message: 'Manual attendance marked successfully',
      records: attendanceRecords.length,
      attendanceData: attendanceRecords
    });
  } catch (error) {
    console.error('Error marking manual attendance:', error);
    res.status(500).json({ error: 'Failed to mark manual attendance' });
  }
});

// Update attendance record (Faculty/Admin only)
router.put('/:attendanceId', verifyToken, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const attendanceDoc = await admin.firestore()
      .collection('attendance')
      .doc(attendanceId)
      .get();

    if (!attendanceDoc.exists) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Faculty can only update their own records
    if (req.user.role === 'faculty' && attendanceDoc.data().facultyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await admin.firestore()
      .collection('attendance')
      .doc(attendanceId)
      .update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.user.uid
      });

    res.json({ message: 'Attendance record updated successfully' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

// Delete attendance record (Admin only)
router.delete('/:attendanceId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { attendanceId } = req.params;

    await admin.firestore()
      .collection('attendance')
      .doc(attendanceId)
      .delete();

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
});

// Get attendance reports (Admin/Faculty)
router.get('/reports', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      startDate,
      endDate,
      classId,
      subjectId,
      facultyId,
      reportType = 'summary'
    } = req.query;

    let query = admin.firestore().collection('attendance');

    // Apply filters
    if (startDate && endDate) {
      query = query.where('date', '>=', startDate).where('date', '<=', endDate);
    }
    if (classId) query = query.where('classId', '==', classId);
    if (subjectId) query = query.where('subjectId', '==', subjectId);
    if (facultyId) query = query.where('facultyId', '==', facultyId);

    const snapshot = await query.get();
    const attendanceData = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get related data
      const [studentDoc, subjectDoc, facultyDoc] = await Promise.all([
        admin.firestore().collection('students').doc(data.studentId).get(),
        admin.firestore().collection('subjects').doc(data.subjectId).get(),
        admin.firestore().collection('faculty').doc(data.facultyId).get()
      ]);
      
      attendanceData.push({
        ...data,
        id: doc.id,
        studentName: studentDoc.exists ? studentDoc.data().name : 'Unknown',
        rollNumber: studentDoc.exists ? studentDoc.data().rollNumber : 'N/A',
        subjectName: subjectDoc.exists ? subjectDoc.data().name : 'Unknown',
        facultyName: facultyDoc.exists ? facultyDoc.data().name : 'Unknown',
        markedAt: data.markedAt?.toDate()
      });
    }

    // Generate reports based on type
    let report = {};
    
    if (reportType === 'detailed') {
      report = { attendanceRecords: attendanceData };
    } else {
      // Summary report
      const classWise = {};
      const subjectWise = {};
      const facultyWise = {};
      
      attendanceData.forEach(record => {
        // Class-wise summary
        if (!classWise[record.classId]) {
          classWise[record.classId] = { total: 0, present: 0 };
        }
        classWise[record.classId].total++;
        if (record.status === 'present') classWise[record.classId].present++;
        
        // Subject-wise summary
        if (!subjectWise[record.subjectId]) {
          subjectWise[record.subjectId] = { 
            subjectName: record.subjectName,
            total: 0, 
            present: 0 
          };
        }
        subjectWise[record.subjectId].total++;
        if (record.status === 'present') subjectWise[record.subjectId].present++;
        
        // Faculty-wise summary
        if (!facultyWise[record.facultyId]) {
          facultyWise[record.facultyId] = { 
            facultyName: record.facultyName,
            total: 0, 
            present: 0 
          };
        }
        facultyWise[record.facultyId].total++;
        if (record.status === 'present') facultyWise[record.facultyId].present++;
      });
      
      // Calculate percentages
      Object.keys(classWise).forEach(classId => {
        const stats = classWise[classId];
        stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
      });
      
      Object.keys(subjectWise).forEach(subjectId => {
        const stats = subjectWise[subjectId];
        stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
      });
      
      Object.keys(facultyWise).forEach(facultyId => {
        const stats = facultyWise[facultyId];
        stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
      });
      
      report = {
        summary: {
          totalRecords: attendanceData.length,
          totalPresent: attendanceData.filter(r => r.status === 'present').length,
          overallPercentage: attendanceData.length > 0 ? 
            Math.round((attendanceData.filter(r => r.status === 'present').length / attendanceData.length) * 100) : 0
        },
        classWise,
        subjectWise,
        facultyWise
      };
    }

    res.json(report);
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ error: 'Failed to generate attendance report' });
  }
});

module.exports = router;
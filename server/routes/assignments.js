const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, images, and text files are allowed.'));
    }
  }
});
const archiver = require('archiver');

// Create new assignment (Faculty only)
router.post('/', verifyToken, upload.single('instructionFile'), async (req, res) => {
  try {
    // Verify user is a faculty member
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied. Faculty only.' });
    }

    const {
      title,
      description,
      classId,
      subjectId,
      dueDate,
      maxMarks = 100,
      instructions,
      allowedFileTypes = 'pdf,doc,docx,ppt,pptx'
    } = req.body;

    let instructionFileUrl = null;
    if (req.file) {
      // Upload instruction file to Firebase Storage
      const bucket = admin.storage().bucket();
      const fileName = `assignments/instructions/${uuidv4()}-${req.file.originalname}`;
      const file = bucket.file(fileName);
      
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype
        }
      });
      
      await file.makePublic();
      instructionFileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    const assignmentData = {
      title,
      description,
      instructions: instructions || '',
      instructionFileUrl,
      classId,
      subjectId,
      facultyId: req.user.uid,
      dueDate: new Date(dueDate),
      maxMarks: parseInt(maxMarks),
      allowedFileTypes: allowedFileTypes.split(',').map(type => type.trim()),
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      submissionsCount: 0
    };

    const docRef = await admin.firestore().collection('assignments').add(assignmentData);
    
    res.status(201).json({
      message: 'Assignment created successfully',
      id: docRef.id,
      ...assignmentData
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Get assignments for current faculty (simplified endpoint)
router.get('/faculty', verifyToken, async (req, res) => {
  try {
    // Verify user is a faculty member
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied. Faculty only.' });
    }

    const facultyId = req.user.uid;
    
    const snapshot = await admin.firestore()
      .collection('assignments')
      .where('facultyId', '==', facultyId)
      .orderBy('createdAt', 'desc')
      .get();

    const assignments = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get subject and class details
      const [subjectDoc, classDoc] = await Promise.all([
        admin.firestore().collection('subjects').doc(data.subjectId).get(),
        admin.firestore().collection('classrooms').doc(data.classId).get()
      ]);
      
      assignments.push({
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        subject: subjectDoc.exists ? subjectDoc.data().name : 'Unknown',
        className: classDoc.exists ? classDoc.data().name : 'Unknown'
      });
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching faculty assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get assignments for faculty
router.get('/faculty/:facultyId?', verifyToken, async (req, res) => {
  try {
    const facultyId = req.params.facultyId || req.user.uid;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.role === 'faculty' && facultyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const snapshot = await admin.firestore()
      .collection('assignments')
      .where('facultyId', '==', facultyId)
      .orderBy('createdAt', 'desc')
      .get();

    const assignments = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get subject and class details
      const [subjectDoc, classDoc] = await Promise.all([
        admin.firestore().collection('subjects').doc(data.subjectId).get(),
        admin.firestore().collection('classrooms').doc(data.classId).get()
      ]);
      
      assignments.push({
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        subject: subjectDoc.exists ? subjectDoc.data().name : 'Unknown',
        className: classDoc.exists ? classDoc.data().name : 'Unknown'
      });
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching faculty assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get assignments for students (by class)
router.get('/class/:classId', verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { subjectId } = req.query;
    
    // Verify user is a student in this class or admin/faculty
    if (req.user.role === 'student') {
      const studentDoc = await admin.firestore().collection('students').doc(req.user.uid).get();
      if (!studentDoc.exists || studentDoc.data().classId !== classId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let query = admin.firestore()
      .collection('assignments')
      .where('classId', '==', classId)
      .where('status', '==', 'active');

    if (subjectId) {
      query = query.where('subjectId', '==', subjectId);
    }

    const snapshot = await query.orderBy('dueDate', 'asc').get();
    const assignments = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get faculty and subject details
      const [facultyDoc, subjectDoc] = await Promise.all([
        admin.firestore().collection('faculty').doc(data.facultyId).get(),
        admin.firestore().collection('subjects').doc(data.subjectId).get()
      ]);
      
      // Check if current user (student) has submitted
      let hasSubmitted = false;
      let submissionData = null;
      
      if (req.user.role === 'student') {
        const submissionSnapshot = await admin.firestore()
          .collection('assignment_submissions')
          .where('assignmentId', '==', doc.id)
          .where('studentId', '==', req.user.uid)
          .get();
        
        hasSubmitted = !submissionSnapshot.empty;
        if (hasSubmitted) {
          submissionData = {
            id: submissionSnapshot.docs[0].id,
            ...submissionSnapshot.docs[0].data(),
            submittedAt: submissionSnapshot.docs[0].data().submittedAt?.toDate()
          };
        }
      }
      
      assignments.push({
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        faculty: facultyDoc.exists ? facultyDoc.data().name : 'Unknown',
        subject: subjectDoc.exists ? subjectDoc.data().name : 'Unknown',
        hasSubmitted,
        submissionData
      });
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching class assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get assignment details
router.get('/:assignmentId', verifyToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignmentDoc = await admin.firestore()
      .collection('assignments')
      .doc(assignmentId)
      .get();
    
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const assignmentData = assignmentDoc.data();
    
    // Check permissions
    if (req.user.role === 'student') {
      const studentDoc = await admin.firestore().collection('students').doc(req.user.uid).get();
      if (!studentDoc.exists || studentDoc.data().classId !== assignmentData.classId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'faculty' && assignmentData.facultyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get related data
    const [facultyDoc, subjectDoc, classDoc] = await Promise.all([
      admin.firestore().collection('faculty').doc(assignmentData.facultyId).get(),
      admin.firestore().collection('subjects').doc(assignmentData.subjectId).get(),
      admin.firestore().collection('classrooms').doc(assignmentData.classId).get()
    ]);
    
    res.json({
      id: assignmentDoc.id,
      ...assignmentData,
      dueDate: assignmentData.dueDate?.toDate(),
      createdAt: assignmentData.createdAt?.toDate(),
      faculty: facultyDoc.exists ? facultyDoc.data().name : 'Unknown',
      subject: subjectDoc.exists ? subjectDoc.data().name : 'Unknown',
      className: classDoc.exists ? classDoc.data().name : 'Unknown'
    });
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ error: 'Failed to fetch assignment details' });
  }
});

// Submit assignment (Student only)
router.post('/:assignmentId/submit', verifyToken, upload.single('submissionFile'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { comments = '' } = req.body;
    
    // Verify user is a student
    const studentDoc = await admin.firestore().collection('students').doc(req.user.uid).get();
    if (!studentDoc.exists || !studentDoc.data().isActive) {
      return res.status(403).json({ error: 'Access denied or account inactive' });
    }
    
    // Get assignment details
    const assignmentDoc = await admin.firestore()
      .collection('assignments')
      .doc(assignmentId)
      .get();
    
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const assignmentData = assignmentDoc.data();
    
    // Check if student belongs to the assignment's class
    if (studentDoc.data().classId !== assignmentData.classId) {
      return res.status(403).json({ error: 'You are not enrolled in this class' });
    }
    
    // Check due date
    if (new Date() > assignmentData.dueDate?.toDate()) {
      return res.status(400).json({ error: 'Assignment submission deadline has passed' });
    }
    
    // Check if already submitted
    const existingSubmission = await admin.firestore()
      .collection('assignment_submissions')
      .where('assignmentId', '==', assignmentId)
      .where('studentId', '==', req.user.uid)
      .get();
    
    if (!existingSubmission.empty) {
      return res.status(409).json({ error: 'Assignment already submitted. Use update endpoint to modify.' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Submission file is required' });
    }
    
    // Upload submission file
    const bucket = admin.storage().bucket();
    const fileName = `assignments/submissions/${assignmentId}/${req.user.uid}/${uuidv4()}-${req.file.originalname}`;
    const file = bucket.file(fileName);
    
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype
      }
    });
    
    await file.makePublic();
    const submissionFileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    // Create submission record
    const submissionData = {
      assignmentId,
      studentId: req.user.uid,
      facultyId: assignmentData.facultyId,
      submissionFileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      comments,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'submitted',
      grade: null,
      feedback: ''
    };
    
    const submissionRef = await admin.firestore()
      .collection('assignment_submissions')
      .add(submissionData);
    
    // Update assignment submissions count
    await admin.firestore()
      .collection('assignments')
      .doc(assignmentId)
      .update({
        submissionsCount: admin.firestore.FieldValue.increment(1)
      });
    
    res.status(201).json({
      message: 'Assignment submitted successfully',
      submissionId: submissionRef.id,
      submissionData: {
        ...submissionData,
        id: submissionRef.id
      }
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// Update assignment submission (Student only, before grading)
router.put('/submission/:submissionId', verifyToken, upload.single('submissionFile'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { comments } = req.body;
    
    const submissionDoc = await admin.firestore()
      .collection('assignment_submissions')
      .doc(submissionId)
      .get();
    
    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const submissionData = submissionDoc.data();
    
    // Check permissions
    if (submissionData.studentId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if already graded
    if (submissionData.grade !== null) {
      return res.status(400).json({ error: 'Cannot update graded submission' });
    }
    
    const updateData = {};
    
    if (comments !== undefined) {
      updateData.comments = comments;
    }
    
    // Update file if provided
    if (req.file) {
      const bucket = admin.storage().bucket();
      const fileName = `assignments/submissions/${submissionData.assignmentId}/${req.user.uid}/${uuidv4()}-${req.file.originalname}`;
      const file = bucket.file(fileName);
      
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype
        }
      });
      
      await file.makePublic();
      updateData.submissionFileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      updateData.fileName = req.file.originalname;
      updateData.fileSize = req.file.size;
    }
    
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await admin.firestore()
      .collection('assignment_submissions')
      .doc(submissionId)
      .update(updateData);
    
    res.json({ message: 'Submission updated successfully' });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// Get assignment submissions (Faculty/Admin only)
router.get('/:assignmentId/submissions', verifyToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Check assignment exists and permissions
    const assignmentDoc = await admin.firestore()
      .collection('assignments')
      .doc(assignmentId)
      .get();
    
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const assignmentData = assignmentDoc.data();
    
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.role === 'faculty' && assignmentData.facultyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const snapshot = await admin.firestore()
      .collection('assignment_submissions')
      .where('assignmentId', '==', assignmentId)
      .orderBy('submittedAt', 'desc')
      .get();
    
    const submissions = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get student details
      const studentDoc = await admin.firestore()
        .collection('students')
        .doc(data.studentId)
        .get();
      
      submissions.push({
        id: doc.id,
        ...data,
        student: studentDoc.exists ? {
          name: studentDoc.data().name,
          rollNumber: studentDoc.data().rollNumber,
          email: studentDoc.data().email
        } : null,
        submittedAt: data.submittedAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      });
    }
    
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Grade assignment submission (Faculty only)
router.put('/submission/:submissionId/grade', verifyToken, async (req, res) => {
  try {
    // Verify user is a faculty member
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied. Faculty only.' });
    }

    const { submissionId } = req.params;
    const { grade, feedback = '' } = req.body;
    
    const submissionDoc = await admin.firestore()
      .collection('assignment_submissions')
      .doc(submissionId)
      .get();
    
    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const submissionData = submissionDoc.data();
    
    // Check if faculty owns this assignment
    if (submissionData.facultyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Validate grade
    const assignmentDoc = await admin.firestore()
      .collection('assignments')
      .doc(submissionData.assignmentId)
      .get();
    
    const maxMarks = assignmentDoc.data()?.maxMarks || 100;
    
    if (grade < 0 || grade > maxMarks) {
      return res.status(400).json({ error: `Grade must be between 0 and ${maxMarks}` });
    }
    
    await admin.firestore()
      .collection('assignment_submissions')
      .doc(submissionId)
      .update({
        grade: parseFloat(grade),
        feedback,
        gradedAt: admin.firestore.FieldValue.serverTimestamp(),
        gradedBy: req.user.uid,
        status: 'graded'
      });
    
    res.json({ message: 'Submission graded successfully' });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// Download all submissions as ZIP (Faculty/Admin only)
router.get('/:assignmentId/download-all', verifyToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Check assignment exists and permissions
    const assignmentDoc = await admin.firestore()
      .collection('assignments')
      .doc(assignmentId)
      .get();
    
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const assignmentData = assignmentDoc.data();
    
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.role === 'faculty' && assignmentData.facultyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get all submissions
    const snapshot = await admin.firestore()
      .collection('assignment_submissions')
      .where('assignmentId', '==', assignmentId)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No submissions found' });
    }
    
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    res.attachment(`${assignmentData.title}-submissions.zip`);
    archive.pipe(res);
    
    const bucket = admin.storage().bucket();
    
    for (const doc of snapshot.docs) {
      const submissionData = doc.data();
      
      // Get student details
      const studentDoc = await admin.firestore()
        .collection('students')
        .doc(submissionData.studentId)
        .get();
      
      const studentName = studentDoc.exists ? studentDoc.data().name : 'Unknown';
      const rollNumber = studentDoc.exists ? studentDoc.data().rollNumber : 'N/A';
      
      try {
        // Extract file path from URL
        const url = submissionData.submissionFileUrl;
        const filePath = url.split('/').pop().split('?')[0];
        const fileName = `${rollNumber}-${studentName}-${submissionData.fileName}`;
        
        // Get file from Firebase Storage
        const file = bucket.file(decodeURIComponent(filePath));
        const stream = file.createReadStream();
        
        archive.append(stream, { name: fileName });
      } catch (fileError) {
        console.error(`Error adding file for student ${studentName}:`, fileError);
        // Add error info to zip
        archive.append(`Error downloading file: ${fileError.message}`, { 
          name: `${rollNumber}-${studentName}-ERROR.txt` 
        });
      }
    }
    
    archive.finalize();
  } catch (error) {
    console.error('Error creating ZIP download:', error);
    res.status(500).json({ error: 'Failed to create download' });
  }
});

// Get all assignments (Admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // Get admin's institution assignments only
    const snapshot = await admin.firestore()
      .collection('assignments')
      .where('adminId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const assignments = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get subject, class, and faculty details
      const [subjectDoc, classDoc, facultyDoc] = await Promise.all([
        admin.firestore().collection('subjects').doc(data.subjectId).get(),
        admin.firestore().collection('classrooms').doc(data.classId).get(),
        admin.firestore().collection('faculty').doc(data.facultyId).get()
      ]);
      
      assignments.push({
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        subject: subjectDoc.exists ? subjectDoc.data().name : 'Unknown',
        className: classDoc.exists ? classDoc.data().name : 'Unknown',
        facultyName: facultyDoc.exists ? facultyDoc.data().name : 'Unknown'
      });
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching all assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Update assignment (Faculty only)
router.put('/:assignmentId', verifyToken, upload.single('instructionFile'), async (req, res) => {
  try {
    // Verify user is a faculty member
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied. Faculty only.' });
    }

    const { assignmentId } = req.params;
    
    const assignmentDoc = await admin.firestore()
      .collection('assignments')
      .doc(assignmentId)
      .get();
    
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const assignmentData = assignmentDoc.data();
    
    if (assignmentData.facultyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updateData = { ...req.body };
    delete updateData.facultyId; // Prevent changing faculty
    delete updateData.submissionsCount; // Prevent manual count changes
    
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }
    
    if (updateData.maxMarks) {
      updateData.maxMarks = parseInt(updateData.maxMarks);
    }
    
    if (updateData.allowedFileTypes && typeof updateData.allowedFileTypes === 'string') {
      updateData.allowedFileTypes = updateData.allowedFileTypes.split(',').map(type => type.trim());
    }
    
    // Handle new instruction file
    if (req.file) {
      const bucket = admin.storage().bucket();
      const fileName = `assignments/instructions/${uuidv4()}-${req.file.originalname}`;
      const file = bucket.file(fileName);
      
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype
        }
      });
      
      await file.makePublic();
      updateData.instructionFileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }
    
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await admin.firestore()
      .collection('assignments')
      .doc(assignmentId)
      .update(updateData);
    
    res.json({ message: 'Assignment updated successfully' });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment (Faculty/Admin only)
router.delete('/:assignmentId', verifyToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignmentDoc = await admin.firestore()
      .collection('assignments')
      .doc(assignmentId)
      .get();
    
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const assignmentData = assignmentDoc.data();
    
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.role === 'faculty' && assignmentData.facultyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Delete all submissions
    const submissionsSnapshot = await admin.firestore()
      .collection('assignment_submissions')
      .where('assignmentId', '==', assignmentId)
      .get();
    
    const batch = admin.firestore().batch();
    
    submissionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete assignment
    batch.delete(admin.firestore().collection('assignments').doc(assignmentId));
    
    await batch.commit();
    
    res.json({ message: 'Assignment and all submissions deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

module.exports = router;
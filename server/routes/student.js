const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads (profile pictures)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG files are allowed.'));
    }
  }
});

// Get all students
router.get('/', verifyToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('students').get();
    const students = [];
    snapshot.forEach(doc => {
      students.push({ id: doc.id, ...doc.data() });
    });
    res.json(students);
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get students by department
router.get('/department/:deptId', verifyToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('students')
      .where('department', '==', req.params.deptId)
      .get();
    
    const students = [];
    snapshot.forEach(doc => {
      students.push({ id: doc.id, ...doc.data() });
    });
    res.json(students);
  } catch (error) {
    console.error('Error getting students by department:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get student by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('students').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create new student
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      rollNumber,
      department,
      semester,
      email,
      contactNumber,
      dateOfBirth,
      address
    } = req.body;

    const studentData = {
      name,
      rollNumber,
      department,
      semester,
      email,
      contactNumber,
      dateOfBirth,
      address,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await admin.firestore().collection('students').add(studentData);
    
    res.status(201).json({ 
      message: 'Student created successfully', 
      id: docRef.id,
      ...studentData
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      rollNumber,
      department,
      semester,
      email,
      contactNumber,
      dateOfBirth,
      address
    } = req.body;

    const studentRef = admin.firestore().collection('students').doc(req.params.id);
    
    await studentRef.update({
      name,
      rollNumber,
      department,
      semester,
      email,
      contactNumber,
      dateOfBirth,
      address,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await admin.firestore().collection('students').doc(req.params.id).delete();
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Bulk import students
router.post('/bulk-import', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { students } = req.body;
    const batch = admin.firestore().batch();
    
    students.forEach(student => {
      const docRef = admin.firestore().collection('students').doc();
      batch.set(docRef, {
        ...student,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    
    res.status(201).json({ 
      message: `Successfully imported ${students.length} students`
    });
  } catch (error) {
    console.error('Error bulk importing students:', error);
    res.status(500).json({ error: 'Failed to import students' });
  }
});

// Student signup endpoint (public)
router.post('/signup', upload.single('profilePicture'), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      rollNumber,
      department,
      semester,
      contactNumber,
      dateOfBirth,
      address,
      guardianName,
      guardianContact,
      adminCode
    } = req.body;

    // Verify admin code and get admin info
    if (!adminCode) {
      return res.status(400).json({ error: 'Admin code is required' });
    }

    const codeSnapshot = await admin.firestore()
      .collection('admin_codes')
      .where('code', '==', adminCode.toUpperCase())
      .where('isActive', '==', true)
      .get();

    if (codeSnapshot.empty) {
      return res.status(400).json({ error: 'Invalid admin code' });
    }

    const codeDoc = codeSnapshot.docs[0];
    const codeData = codeDoc.data();
    const adminId = codeData.adminId;

    // Check if code has expired
    const now = new Date();
    if (codeData.expiresAt && now > codeData.expiresAt.toDate()) {
      return res.status(400).json({ error: 'Admin code has expired' });
    }

    // Check if max uses reached
    if (codeData.maxUses && codeData.currentUses >= codeData.maxUses) {
      return res.status(400).json({ error: 'Admin code usage limit reached' });
    }

    // Check if student already exists
    const existingStudent = await admin.firestore()
      .collection('students')
      .where('email', '==', email)
      .get();

    if (!existingStudent.empty) {
      return res.status(409).json({ error: 'Student with this email already exists' });
    }

    // Check for existing signup request
    const existingRequest = await admin.firestore()
      .collection('student_signup_requests')
      .where('email', '==', email)
      .get();

    if (!existingRequest.empty) {
      return res.status(409).json({ error: 'Signup request already submitted. Please wait for admin approval.' });
    }

    let profilePictureUrl = null;
    if (req.file) {
      // Upload to Firebase Storage
      const bucket = admin.storage().bucket();
      const fileName = `student-profiles/${uuidv4()}-${req.file.originalname}`;
      const file = bucket.file(fileName);
      
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype
        }
      });
      
      // Make file publicly readable
      await file.makePublic();
      profilePictureUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    // Create signup request
    const signupRequestData = {
      name,
      email,
      password, // In production, hash this before storing
      rollNumber,
      department,
      semester,
      contactNumber,
      dateOfBirth,
      address,
      guardianName,
      guardianContact,
      profilePictureUrl,
      adminId, // Link to the admin who owns the code
      adminCode: adminCode.toUpperCase(),
      codeId: codeDoc.id,
      status: 'pending',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedAt: null,
      approvedBy: null
    };

    const docRef = await admin.firestore()
      .collection('student_signup_requests')
      .add(signupRequestData);
    
    res.status(201).json({ 
      message: 'Signup request submitted successfully. Please wait for admin approval.',
      requestId: docRef.id
    });
  } catch (error) {
    console.error('Error in student signup:', error);
    res.status(500).json({ error: 'Failed to submit signup request' });
  }
});

// Get all pending signup requests (Admin only)
router.get('/signup-requests', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('student_signup_requests')
      .where('adminId', '==', req.user.uid)
      .where('status', '==', 'pending')
      .orderBy('requestedAt', 'desc')
      .get();
    
    const requests = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        password: undefined, // Don't send password in response
        requestedAt: data.requestedAt?.toDate()
      });
    });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching signup requests:', error);
    res.status(500).json({ error: 'Failed to fetch signup requests' });
  }
});

// Approve student signup (Admin only)
router.post('/approve-signup/:requestId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;

    const requestDoc = await admin.firestore()
      .collection('student_signup_requests')
      .doc(requestId)
      .get();
    
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Signup request not found' });
    }

    const requestData = requestDoc.data();
    if (requestData.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Verify that the current admin owns this request
    if (requestData.adminId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied - this request does not belong to your institution' });
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: requestData.email,
      password: requestData.password,
      displayName: requestData.name,
      photoURL: requestData.profilePictureUrl
    });

    // Create student document
    const studentData = {
      uid: userRecord.uid,
      name: requestData.name,
      email: requestData.email,
      rollNumber: requestData.rollNumber,
      department: requestData.department,
      semester: requestData.semester,
      contactNumber: requestData.contactNumber,
      dateOfBirth: requestData.dateOfBirth,
      address: requestData.address,
      guardianName: requestData.guardianName,
      guardianContact: requestData.guardianContact,
      profilePictureUrl: requestData.profilePictureUrl,
      adminId: requestData.adminId, // Link student to admin
      adminCode: requestData.adminCode,
      status: 'approved',
      role: 'student',
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      attendancePercentage: 0,
      assignmentsSubmitted: 0,
      isActive: true
    };

    await admin.firestore().collection('students').doc(userRecord.uid).set(studentData);

    // Update signup request status
    await admin.firestore()
      .collection('student_signup_requests')
      .doc(requestId)
      .update({
        status: 'approved',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: req.user.uid,
        studentId: userRecord.uid
      });

    // Increment admin code usage
    if (requestData.codeId) {
      await admin.firestore()
        .collection('admin_codes')
        .doc(requestData.codeId)
        .update({
          currentUses: admin.firestore.FieldValue.increment(1),
          usedBy: admin.firestore.FieldValue.arrayUnion(userRecord.uid),
          lastUsedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    res.json({ 
      message: 'Student approved and account created successfully',
      studentId: userRecord.uid
    });
  } catch (error) {
    console.error('Error approving student:', error);
    res.status(500).json({ error: 'Failed to approve student' });
  }
});

// Reject student signup (Admin only)
router.post('/reject-signup/:requestId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    // Check if request exists and belongs to this admin
    const requestDoc = await admin.firestore()
      .collection('student_signup_requests')
      .doc(requestId)
      .get();
    
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Signup request not found' });
    }

    const requestData = requestDoc.data();
    if (requestData.adminId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied - this request does not belong to your institution' });
    }

    await admin.firestore()
      .collection('student_signup_requests')
      .doc(requestId)
      .update({
        status: 'rejected',
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        rejectedBy: req.user.uid,
        rejectionReason: reason || 'No reason provided'
      });

    res.json({ message: 'Student signup request rejected' });
  } catch (error) {
    console.error('Error rejecting student:', error);
    res.status(500).json({ error: 'Failed to reject student' });
  }
});

// Block/Unblock student (Admin only)
router.patch('/toggle-status/:studentId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { action } = req.body; // 'block' or 'unblock'

    const studentDoc = await admin.firestore()
      .collection('students')
      .doc(studentId)
      .get();

    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const isActive = action === 'unblock';
    
    // Update student status
    await admin.firestore()
      .collection('students')
      .doc(studentId)
      .update({
        isActive,
        [`${action}edAt`]: admin.firestore.FieldValue.serverTimestamp(),
        [`${action}edBy`]: req.user.uid
      });

    // Disable/Enable Firebase Auth user
    await admin.auth().updateUser(studentId, {
      disabled: !isActive
    });

    res.json({ 
      message: `Student ${action}ed successfully`,
      isActive
    });
  } catch (error) {
    console.error(`Error ${req.body.action}ing student:`, error);
    res.status(500).json({ error: `Failed to ${req.body.action} student` });
  }
});

// Get student profile (Student can view their own, Admin/Faculty can view any)
router.get('/profile/:studentId?', verifyToken, async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user.uid;
    
    // Check permissions
    if (studentId !== req.user.uid && req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const studentDoc = await admin.firestore()
      .collection('students')
      .doc(studentId)
      .get();

    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentData = studentDoc.data();
    
    // Get attendance statistics
    const attendanceSnapshot = await admin.firestore()
      .collection('attendance')
      .where('studentId', '==', studentId)
      .get();
    
    const totalClasses = attendanceSnapshot.size;
    const presentClasses = attendanceSnapshot.docs.filter(doc => 
      doc.data().status === 'present'
    ).length;
    
    const attendancePercentage = totalClasses > 0 ? 
      Math.round((presentClasses / totalClasses) * 100) : 0;

    // Get assignment submission statistics
    const assignmentSubmissions = await admin.firestore()
      .collection('assignment_submissions')
      .where('studentId', '==', studentId)
      .get();

    res.json({
      ...studentData,
      attendanceStats: {
        totalClasses,
        presentClasses,
        attendancePercentage
      },
      assignmentStats: {
        totalSubmissions: assignmentSubmissions.size
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

// Update student profile
router.put('/profile/:studentId?', verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user.uid;
    
    // Check permissions
    if (studentId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = { ...req.body };
    delete updateData.uid;
    delete updateData.role;
    delete updateData.status;
    
    // Handle profile picture upload
    if (req.file) {
      const bucket = admin.storage().bucket();
      const fileName = `student-profiles/${studentId}-${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(fileName);
      
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype
        }
      });
      
      await file.makePublic();
      updateData.profilePictureUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await admin.firestore()
      .collection('students')
      .doc(studentId)
      .update(updateData);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;

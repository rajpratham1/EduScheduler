const admin = require('firebase-admin');

// Verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has admin role in Firestore
    const adminDoc = await admin.firestore()
      .collection('admins')
      .doc(req.user.uid)
      .get();

    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user is faculty
const requireFaculty = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has faculty role in Firestore
    const facultyDoc = await admin.firestore()
      .collection('faculty')
      .doc(req.user.uid)
      .get();

    if (!facultyDoc.exists || facultyDoc.data().role !== 'faculty') {
      return res.status(403).json({ error: 'Faculty access required' });
    }

    next();
  } catch (error) {
    console.error('Faculty check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Check if user is student
const requireStudent = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has student role in Firestore
    const studentDoc = await admin.firestore()
      .collection('students')
      .doc(req.user.uid)
      .get();

    if (!studentDoc.exists || studentDoc.data().role !== 'student' || !studentDoc.data().isActive) {
      return res.status(403).json({ error: 'Student access required or account inactive' });
    }

    next();
  } catch (error) {
    console.error('Student check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireFaculty,
  requireStudent
};

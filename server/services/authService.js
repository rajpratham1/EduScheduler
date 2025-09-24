const admin = require('firebase-admin');

class AuthService {
  // Verify user token
  async verifyToken(token) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Create admin account
  async createAdmin({ email, password, name, createdBy }) {
    try {
      // Validate Gmail address
      if (!email.toLowerCase().endsWith('@gmail.com')) {
        throw new Error('Only Gmail addresses are allowed');
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
        createdBy: createdBy || 'self'
      });

      return {
        success: true,
        uid: userRecord.uid,
        secretCode
      };
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  // Create faculty account
  async createFaculty({ email, password, name, department, adminId, secretCode }) {
    try {
      // Validate request
      if (!email || !password || !name || !department || !adminId || !secretCode) {
        throw new Error('All fields are required');
      }

      // Verify admin exists and secret code is valid
      const adminDoc = await admin.firestore().collection('admins').doc(adminId).get();
      if (!adminDoc.exists || adminDoc.data().secretCode !== secretCode) {
        throw new Error('Invalid admin credentials');
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        needsPasswordChange: true
      });

      return {
        success: true,
        uid: userRecord.uid
      };
    } catch (error) {
      console.error('Error creating faculty:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(uid, role) {
    try {
      const collection = role === 'admin' ? 'admins' : 'faculty';
      const doc = await admin.firestore().collection(collection).doc(uid).get();
      
      if (!doc.exists) {
        throw new Error('User not found');
      }

      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(uid, role, data) {
    try {
      const collection = role === 'admin' ? 'admins' : 'faculty';
      await admin.firestore().collection(collection).doc(uid).update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Delete user account
  async deleteUser(uid, role) {
    try {
      // Delete from Firebase Auth
      await admin.auth().deleteUser(uid);
      
      // Delete from Firestore
      const collection = role === 'admin' ? 'admins' : 'faculty';
      await admin.firestore().collection(collection).doc(uid).delete();

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      const link = await admin.auth().generatePasswordResetLink(email);
      return { success: true, link };
    } catch (error) {
      console.error('Error generating password reset link:', error);
      throw error;
    }
  }

  // Update password
  async updatePassword(uid, newPassword) {
    try {
      await admin.auth().updateUser(uid, { password: newPassword });
      
      // Check if it's a faculty member and update needsPasswordChange flag
      const facultyDoc = await admin.firestore().collection('faculty').doc(uid).get();
      if (facultyDoc.exists) {
        await admin.firestore().collection('faculty').doc(uid).update({
          needsPasswordChange: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // Verify admin credentials
  async verifyAdmin(uid) {
    try {
      const adminDoc = await admin.firestore().collection('admins').doc(uid).get();
      
      if (!adminDoc.exists || !adminDoc.data().isActive) {
        throw new Error('Invalid or inactive admin account');
      }

      return {
        success: true,
        admin: {
          id: adminDoc.id,
          ...adminDoc.data()
        }
      };
    } catch (error) {
      console.error('Error verifying admin:', error);
      throw error;
    }
  }

  // Verify faculty credentials
  async verifyFaculty(uid) {
    try {
      const facultyDoc = await admin.firestore().collection('faculty').doc(uid).get();
      
      if (!facultyDoc.exists || !facultyDoc.data().isActive) {
        throw new Error('Invalid or inactive faculty account');
      }

      return {
        success: true,
        faculty: {
          id: facultyDoc.id,
          ...facultyDoc.data()
        }
      };
    } catch (error) {
      console.error('Error verifying faculty:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updatePassword,
  User,
  UserCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface AdminProfile {
  id?: string;
  name: string;
  email: string;
  role: 'admin';
  secretCode: string;
  createdAt: any;
  isActive: boolean;
  createdBy?: string;
}

export interface FacultyProfile {
  id?: string;
  name: string;
  email: string;
  department: string;
  role: 'faculty';
  adminId: string;
  secretCode: string;
  createdAt: any;
  isActive: boolean;
  needsPasswordChange: boolean;
}

class AuthService {
  // Generate unique secret code for admin
  async generateUniqueSecretCode(): Promise<string> {
    let code: string;
    let exists = true;
    
    while (exists) {
      code = 'ADMIN' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const q = query(collection(db, 'admins'), where('secretCode', '==', code));
      const querySnapshot = await getDocs(q);
      exists = !querySnapshot.empty;
    }
    
    return code!;
  }

  // Create new admin account
  async createAdmin(adminData: {
    name: string;
    email: string;
    password: string;
    createdBy?: string;
  }): Promise<{ success: boolean; message: string; adminId?: string; secretCode?: string }> {
    try {
      // Validate Gmail address
      if (!adminData.email.toLowerCase().endsWith('@gmail.com')) {
        return { success: false, message: 'Only Gmail addresses are allowed for admin accounts' };
      }

      // Check if admin already exists
      const q = query(collection(db, 'admins'), where('email', '==', adminData.email));
      const existingAdmin = await getDocs(q);
      
      if (!existingAdmin.empty) {
        return { success: false, message: 'Admin with this email already exists' };
      }

      // Create Firebase Auth user
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth, 
        adminData.email, 
        adminData.password
      );

      // Generate unique secret code
      const secretCode = await this.generateUniqueSecretCode();

      // Create admin profile in Firestore
      const adminProfile: AdminProfile = {
        name: adminData.name,
        email: adminData.email,
        role: 'admin',
        secretCode,
        createdAt: serverTimestamp(),
        isActive: true,
        createdBy: adminData.createdBy || 'system'
      };

      await setDoc(doc(db, 'admins', userCredential.user.uid), adminProfile);

      return { 
        success: true, 
        message: 'Admin account created successfully', 
        adminId: userCredential.user.uid,
        secretCode 
      };
    } catch (error: any) {
      console.error('Error creating admin:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to create admin account' 
      };
    }
  }

  // Create faculty account
  async createFaculty(facultyData: {
    name: string;
    email: string;
    department: string;
    password: string;
    adminId: string;
    secretCode: string;
  }): Promise<{ success: boolean; message: string; facultyId?: string }> {
    try {
      // Validate Gmail address
      if (!facultyData.email.toLowerCase().endsWith('@gmail.com')) {
        return { success: false, message: 'Only Gmail addresses are allowed for faculty accounts' };
      }

      // Verify admin exists and secret code is valid
      const adminDoc = await getDoc(doc(db, 'admins', facultyData.adminId));
      if (!adminDoc.exists() || adminDoc.data().secretCode !== facultyData.secretCode) {
        return { success: false, message: 'Invalid admin credentials' };
      }

      // Check if faculty already exists
      const q = query(collection(db, 'faculty'), where('email', '==', facultyData.email));
      const existingFaculty = await getDocs(q);
      
      if (!existingFaculty.empty) {
        return { success: false, message: 'Faculty with this email already exists' };
      }

      // Create Firebase Auth user
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth, 
        facultyData.email, 
        facultyData.password
      );

      // Create faculty profile in Firestore
      const facultyProfile: FacultyProfile = {
        name: facultyData.name,
        email: facultyData.email,
        department: facultyData.department,
        role: 'faculty',
        adminId: facultyData.adminId,
        secretCode: facultyData.secretCode,
        createdAt: serverTimestamp(),
        isActive: true,
        needsPasswordChange: true
      };

      await setDoc(doc(db, 'faculty', userCredential.user.uid), facultyProfile);

      return { 
        success: true, 
        message: 'Faculty account created successfully', 
        facultyId: userCredential.user.uid 
      };
    } catch (error: any) {
      console.error('Error creating faculty:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to create faculty account' 
      };
    }
  }

  // Admin login
  async loginAdmin(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    user?: User;
    profile?: AdminProfile;
  }> {
    try {
      let userCredential: UserCredential;
      let adminDoc;

      // Handle default admin login
      if (email.toLowerCase() === 'rajpratham40@gmail.com') {
        try {
          // First try to sign in
          try {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
          } catch (signInError: any) {
            if (signInError.code === 'auth/user-not-found') {
              // User doesn't exist, create new account
              userCredential = await createUserWithEmailAndPassword(auth, email, password);

              // Create admin profile immediately after creating the account
              const adminData: AdminProfile = {
                name: 'Raj Pratham',
                email: email.toLowerCase(),
                role: 'admin',
                secretCode: 'ADMIN001',
                createdAt: serverTimestamp(),
                isActive: true,
                createdBy: 'system'
              };
              
              await setDoc(doc(db, 'admins', userCredential.user.uid), adminData);
            } else {
              throw signInError;
            }
          }

          // Check if admin document exists
          adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
          
          if (!adminDoc.exists()) {
            // Create admin profile if it doesn't exist (this is a safeguard)
            const adminData: AdminProfile = {
              name: 'Raj Pratham',
              email: email.toLowerCase(),
              role: 'admin',
              secretCode: 'ADMIN001',
              createdAt: serverTimestamp(),
              isActive: true,
              createdBy: 'system'
            };
            
            await setDoc(doc(db, 'admins', userCredential.user.uid), adminData);
            adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
          }

          return {
            success: true,
            message: 'Login successful',
            user: userCredential.user,
            profile: { id: adminDoc.id, ...adminDoc.data() as AdminProfile }
          };
        } catch (error: any) {
          console.error('Admin login error:', error);
          if (error.code === 'auth/wrong-password') {
            return { success: false, message: 'Invalid password' };
          }
          return { success: false, message: `Authentication error: ${error.message}` };
        }
      }

      // For non-default admin
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
        
        if (!adminDoc.exists()) {
          await signOut(auth);
          return { success: false, message: 'Admin profile not found' };
        }

        const profile = { id: adminDoc.id, ...adminDoc.data() } as AdminProfile;
        
        if (!profile.isActive) {
          await signOut(auth);
          return { success: false, message: 'Admin account is deactivated' };
        }

        return { 
          success: true, 
          message: 'Login successful', 
          user: userCredential.user,
          profile 
        };
      } catch (error: any) {
        console.error('Non-default admin login error:', error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          return { success: false, message: 'Invalid email or password' };
        }
        return { success: false, message: error.message };
      }
    } catch (error: any) {
      console.error('Unexpected error during admin login:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  }

  // Faculty login
  async loginFaculty(email: string, password: string, secretCode: string): Promise<{
    success: boolean;
    message: string;
    user?: User;
    profile?: FacultyProfile;
  }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const facultyDoc = await getDoc(doc(db, 'faculty', userCredential.user.uid));
      
      if (!facultyDoc.exists()) {
        await signOut(auth);
        return { success: false, message: 'Faculty profile not found' };
      }

      const profile = { id: facultyDoc.id, ...facultyDoc.data() } as FacultyProfile;
      
      if (profile.secretCode !== secretCode) {
        await signOut(auth);
        return { success: false, message: 'Invalid secret code' };
      }

      if (!profile.isActive) {
        await signOut(auth);
        return { success: false, message: 'Faculty account is deactivated' };
      }

      return { 
        success: true, 
        message: 'Login successful', 
        user: userCredential.user,
        profile 
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Login failed' 
      };
    }
  }

  // Get all admins
  async getAllAdmins(): Promise<AdminProfile[]> {
    try {
      const q = query(collection(db, 'admins'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminProfile));
    } catch (error) {
      console.error('Error fetching admins:', error);
      return [];
    }
  }

  // Get faculty by admin
  async getFacultyByAdmin(adminId: string): Promise<FacultyProfile[]> {
    try {
      const q = query(collection(db, 'faculty'), where('adminId', '==', adminId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacultyProfile));
    } catch (error) {
      console.error('Error fetching faculty:', error);
      return [];
    }
  }

  // Update password
  async updateUserPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'No user logged in' };
      }

      await updatePassword(user, newPassword);
      
      // Update needsPasswordChange flag for faculty
      const facultyDoc = await getDoc(doc(db, 'faculty', user.uid));
      if (facultyDoc.exists()) {
        await updateDoc(doc(db, 'faculty', user.uid), {
          needsPasswordChange: false
        });
      }

      return { success: true, message: 'Password updated successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update password' };
    }
  }

  // Refresh auth token
  async refreshAuthToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken(true);
        localStorage.setItem('authToken', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  // Logout
  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
    await signOut(auth);
  }

  // Get current user profile
  async getCurrentUserProfile(): Promise<AdminProfile | FacultyProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      // Check if admin
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (adminDoc.exists()) {
        return { id: adminDoc.id, ...adminDoc.data() } as AdminProfile;
      }

      // Check if faculty
      const facultyDoc = await getDoc(doc(db, 'faculty', user.uid));
      if (facultyDoc.exists()) {
        return { id: facultyDoc.id, ...facultyDoc.data() } as FacultyProfile;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
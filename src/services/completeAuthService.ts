import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
  onAuthStateChanged,
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
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import {
  Admin,
  AdminSecretCode,
  Faculty,
  Student,
  StudentSignupRequest,
  ApiResponse,
  AdminSignupFormData,
  StudentSignupFormData,
  FacultySignupFormData,
  LoginFormData,
} from '../types/models';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'admin' | 'faculty' | 'student';
  profile: Admin | Faculty | Student;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

class CompleteAuthService {
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];
  private currentUser: AuthUser | null = null;

  constructor() {
    this.initAuthListener();
  }

  // Initialize auth state listener
  private initAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await this.getUserProfile(firebaseUser.uid);
          if (userProfile) {
            this.currentUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName,
              role: userProfile.role,
              profile: userProfile.profile,
            };
          } else {
            this.currentUser = null;
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          this.currentUser = null;
        }
      } else {
        this.currentUser = null;
      }

      // Notify all listeners
      this.authStateListeners.forEach(listener => listener(this.currentUser));
    });
  }

  // Add auth state listener
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    this.authStateListeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Generate unique secret code
  private async generateUniqueSecretCode(): Promise<string> {
    let code: string;
    let exists: boolean;
    
    do {
      // Generate 8-character alphanumeric code
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const q = query(collection(db, 'admin_secret_codes'), where('code', '==', code));
      const snapshot = await getDocs(q);
      exists = !snapshot.empty;
    } while (exists);
    
    return code;
  }

  // Get user profile based on UID
  private async getUserProfile(uid: string): Promise<{role: 'admin' | 'faculty' | 'student', profile: Admin | Faculty | Student} | null> {
    try {
      // Check if admin
      const adminDoc = await getDoc(doc(db, 'admins', uid));
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        return {
          role: 'admin',
          profile: {
            ...data,
            id: adminDoc.id,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as Admin,
        };
      }

      // Check if faculty
      const facultyDoc = await getDoc(doc(db, 'faculty', uid));
      if (facultyDoc.exists()) {
        const data = facultyDoc.data();
        return {
          role: 'faculty',
          profile: {
            ...data,
            id: facultyDoc.id,
            joiningDate: data.joiningDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as Faculty,
        };
      }

      // Check if student
      const studentDoc = await getDoc(doc(db, 'students', uid));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        return {
          role: 'student',
          profile: {
            ...data,
            id: studentDoc.id,
            dateOfBirth: data.dateOfBirth?.toDate(),
            admissionDate: data.admissionDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as Student,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Admin signup
  async signupAdmin(formData: AdminSignupFormData): Promise<ApiResponse<{ user: AuthUser; secretCode: string }>> {
    try {
      // Check if admin already exists
      const existingAdminQuery = query(
        collection(db, 'admins'),
        where('email', '==', formData.email.toLowerCase())
      );
      const existingAdminSnapshot = await getDocs(existingAdminQuery);

      if (!existingAdminSnapshot.empty) {
        return { success: false, error: 'Admin with this email already exists' };
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.name });

      // Generate unique secret code
      const secretCode = await this.generateUniqueSecretCode();

      // Create admin profile
      const adminData: Omit<Admin, 'id'> = {
        name: formData.name,
        email: formData.email.toLowerCase(),
        role: 'admin',
        institutionName: formData.institutionName,
        institutionAddress: formData.institutionAddress,
        contactNumber: formData.contactNumber,
        isActive: true,
        secretCode,
        subscription: {
          plan: 'free',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          maxStudents: 50,
          maxFaculty: 10,
        },
        settings: {
          classDuration: 60,
          breakDuration: 10,
          lunchBreakStart: '12:00',
          lunchBreakEnd: '13:00',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          academicYear: {
            start: new Date(),
            end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            name: '2024-25',
          },
          timeSlots: [
            { start: '09:00', end: '10:00', duration: 60 },
            { start: '10:00', end: '11:00', duration: 60 },
            { start: '11:00', end: '12:00', duration: 60 },
            { start: '13:00', end: '14:00', duration: 60 },
            { start: '14:00', end: '15:00', duration: 60 },
            { start: '15:00', end: '16:00', duration: 60 },
          ],
          maxClassesPerDay: 6,
          enableAttendance: true,
          enableAssignments: true,
          enableAnnouncements: true,
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
        adminId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save admin data to Firestore
      await setDoc(doc(db, 'admins', user.uid), {
        ...adminData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create secret code document
      await addDoc(collection(db, 'admin_secret_codes'), {
        code: secretCode,
        isActive: true,
        usedBy: { students: 0, faculty: 0 },
        adminId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create auth user object
      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email!,
        displayName: formData.name,
        role: 'admin',
        profile: { ...adminData, id: user.uid } as Admin,
      };

      return {
        success: true,
        data: { user: authUser, secretCode },
        message: 'Admin account created successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Student signup request
  async signupStudent(formData: StudentSignupFormData): Promise<ApiResponse<StudentSignupRequest>> {
    try {
      // Verify secret code
      const secretCodeQuery = query(
        collection(db, 'admin_secret_codes'),
        where('code', '==', formData.secretCode),
        where('isActive', '==', true)
      );
      const secretCodeSnapshot = await getDocs(secretCodeQuery);

      if (secretCodeSnapshot.empty) {
        return { success: false, error: 'Invalid admin secret code' };
      }

      const secretCodeDoc = secretCodeSnapshot.docs[0];
      const secretCodeData = secretCodeDoc.data() as AdminSecretCode;

      // Check if student with this email or roll number already exists
      const existingStudentQuery = query(
        collection(db, 'students'),
        where('adminId', '==', secretCodeData.adminId)
      );
      const existingStudentSnapshot = await getDocs(existingStudentQuery);
      
      const existingStudent = existingStudentSnapshot.docs.find(doc => {
        const data = doc.data();
        return data.email === formData.email || data.rollNumber === formData.rollNumber;
      });

      if (existingStudent) {
        return { success: false, error: 'Student with this email or roll number already exists' };
      }

      // Check for existing pending request
      const existingRequestQuery = query(
        collection(db, 'student_signup_requests'),
        where('adminId', '==', secretCodeData.adminId),
        where('status', '==', 'pending')
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      const existingRequest = existingRequestSnapshot.docs.find(doc => {
        const data = doc.data();
        return data.email === formData.email || data.rollNumber === formData.rollNumber;
      });

      if (existingRequest) {
        return { success: false, error: 'A signup request with this email or roll number is already pending' };
      }

      // Create signup request
      const requestData: Omit<StudentSignupRequest, 'id'> = {
        name: formData.name,
        email: formData.email.toLowerCase(),
        rollNumber: formData.rollNumber,
        department: formData.department,
        semester: formData.semester,
        contactNumber: formData.contactNumber,
        secretCode: formData.secretCode,
        status: 'pending',
        submittedAt: new Date(),
        adminId: secretCodeData.adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'student_signup_requests'), {
        ...requestData,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        data: { ...requestData, id: docRef.id },
        message: 'Signup request submitted successfully. Please wait for admin approval.',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Faculty signup (requires admin approval)
  async signupFaculty(formData: FacultySignupFormData): Promise<ApiResponse<string>> {
    try {
      // Verify secret code
      const secretCodeQuery = query(
        collection(db, 'admin_secret_codes'),
        where('code', '==', formData.secretCode),
        where('isActive', '==', true)
      );
      const secretCodeSnapshot = await getDocs(secretCodeQuery);

      if (secretCodeSnapshot.empty) {
        return { success: false, error: 'Invalid admin secret code' };
      }

      const secretCodeDoc = secretCodeSnapshot.docs[0];
      const secretCodeData = secretCodeDoc.data() as AdminSecretCode;

      // Check if faculty already exists
      const existingFacultyQuery = query(
        collection(db, 'faculty'),
        where('adminId', '==', secretCodeData.adminId)
      );
      const existingFacultySnapshot = await getDocs(existingFacultyQuery);

      const existingFaculty = existingFacultySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.email === formData.email || data.employeeId === formData.employeeId;
      });

      if (existingFaculty) {
        return { success: false, error: 'Faculty with this email or employee ID already exists' };
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.name });

      // Create faculty profile
      const facultyData: Omit<Faculty, 'id'> = {
        uid: user.uid,
        name: formData.name,
        email: formData.email.toLowerCase(),
        department: formData.department,
        subjects: [],
        designation: formData.designation,
        contactNumber: formData.contactNumber,
        joiningDate: new Date(),
        qualification: formData.qualification,
        experience: formData.experience,
        isActive: true,
        employeeId: formData.employeeId,
        status: 'active',
        workingHours: {
          start: '09:00',
          end: '17:00',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        preferences: {
          preferredTimeSlots: [],
          maxHoursPerDay: 6,
          maxHoursPerWeek: 30,
        },
        adminId: secretCodeData.adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'faculty', user.uid), {
        ...facultyData,
        joiningDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update secret code usage
      await updateDoc(secretCodeDoc.ref, {
        'usedBy.faculty': secretCodeData.usedBy.faculty + 1,
      });

      return {
        success: true,
        data: user.uid,
        message: 'Faculty account created successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Login
  async login(formData: LoginFormData, role: 'admin' | 'faculty' | 'student', secretCode?: string): Promise<ApiResponse<AuthUser>> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Get user profile
      const userProfile = await this.getUserProfile(user.uid);
      
      if (!userProfile) {
        await signOut(auth);
        return { success: false, error: 'User profile not found' };
      }

      if (userProfile.role !== role) {
        await signOut(auth);
        return { success: false, error: 'Invalid role for this account' };
      }

      // Verify secret code for faculty and students
      if (role === 'faculty') {
        const faculty = userProfile.profile as Faculty;
        if (!secretCode) {
          await signOut(auth);
          return { success: false, error: 'Secret code is required for faculty login' };
        }

        // Verify secret code belongs to the same admin
        const secretCodeQuery = query(
          collection(db, 'admin_secret_codes'),
          where('code', '==', secretCode),
          where('adminId', '==', faculty.adminId),
          where('isActive', '==', true)
        );
        const secretCodeSnapshot = await getDocs(secretCodeQuery);

        if (secretCodeSnapshot.empty) {
          await signOut(auth);
          return { success: false, error: 'Invalid secret code' };
        }

        if (!faculty.isActive) {
          await signOut(auth);
          return { success: false, error: 'Faculty account is deactivated' };
        }
      }

      if (role === 'student') {
        const student = userProfile.profile as Student;
        if (student.status !== 'approved') {
          await signOut(auth);
          return { success: false, error: 'Student account is not approved yet' };
        }

        if (!secretCode) {
          await signOut(auth);
          return { success: false, error: 'Secret code is required for student login' };
        }

        // Verify secret code belongs to the same admin
        const secretCodeQuery = query(
          collection(db, 'admin_secret_codes'),
          where('code', '==', secretCode),
          where('adminId', '==', student.adminId),
          where('isActive', '==', true)
        );
        const secretCodeSnapshot = await getDocs(secretCodeQuery);

        if (secretCodeSnapshot.empty) {
          await signOut(auth);
          return { success: false, error: 'Invalid secret code' };
        }
      }

      if (role === 'admin') {
        const admin = userProfile.profile as Admin;
        if (!admin.isActive) {
          await signOut(auth);
          return { success: false, error: 'Admin account is deactivated' };
        }
      }

      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName,
        role: userProfile.role,
        profile: userProfile.profile,
      };

      return {
        success: true,
        data: authUser,
        message: 'Login successful',
      };
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return { success: false, error: 'Invalid email or password' };
      }
      return { success: false, error: error.message };
    }
  }

  // Logout
  async logout(): Promise<ApiResponse<void>> {
    try {
      await signOut(auth);
      return { success: true, message: 'Logged out successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Password reset
  async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Update password
  async updatePassword(newPassword: string): Promise<ApiResponse<void>> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      await updatePassword(user, newPassword);
      return { success: true, message: 'Password updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Check user role
  hasRole(role: 'admin' | 'faculty' | 'student'): boolean {
    return this.currentUser?.role === role;
  }

  // Get admin secret code
  async getAdminSecretCode(adminId: string): Promise<ApiResponse<string>> {
    try {
      const secretCodeQuery = query(
        collection(db, 'admin_secret_codes'),
        where('adminId', '==', adminId),
        where('isActive', '==', true)
      );
      const secretCodeSnapshot = await getDocs(secretCodeQuery);

      if (secretCodeSnapshot.empty) {
        return { success: false, error: 'Secret code not found' };
      }

      const secretCodeData = secretCodeSnapshot.docs[0].data() as AdminSecretCode;
      return { success: true, data: secretCodeData.code };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Regenerate admin secret code
  async regenerateSecretCode(adminId: string): Promise<ApiResponse<string>> {
    try {
      // Deactivate current secret code
      const currentSecretCodeQuery = query(
        collection(db, 'admin_secret_codes'),
        where('adminId', '==', adminId),
        where('isActive', '==', true)
      );
      const currentSecretCodeSnapshot = await getDocs(currentSecretCodeQuery);

      if (!currentSecretCodeSnapshot.empty) {
        const currentSecretCodeDoc = currentSecretCodeSnapshot.docs[0];
        await updateDoc(currentSecretCodeDoc.ref, { isActive: false });
      }

      // Generate new secret code
      const newSecretCode = await this.generateUniqueSecretCode();

      // Create new secret code document
      await addDoc(collection(db, 'admin_secret_codes'), {
        code: newSecretCode,
        isActive: true,
        usedBy: { students: 0, faculty: 0 },
        adminId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update admin's secret code
      await updateDoc(doc(db, 'admins', adminId), {
        secretCode: newSecretCode,
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: newSecretCode, message: 'Secret code regenerated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Verify secret code
  async verifySecretCode(code: string): Promise<ApiResponse<{ adminId: string; adminName: string; institutionName: string }>> {
    try {
      const secretCodeQuery = query(
        collection(db, 'admin_secret_codes'),
        where('code', '==', code),
        where('isActive', '==', true)
      );
      const secretCodeSnapshot = await getDocs(secretCodeQuery);

      if (secretCodeSnapshot.empty) {
        return { success: false, error: 'Invalid secret code' };
      }

      const secretCodeData = secretCodeSnapshot.docs[0].data() as AdminSecretCode;
      
      // Get admin info
      const adminDoc = await getDoc(doc(db, 'admins', secretCodeData.adminId));
      if (!adminDoc.exists()) {
        return { success: false, error: 'Admin not found' };
      }

      const adminData = adminDoc.data() as Admin;

      return {
        success: true,
        data: {
          adminId: secretCodeData.adminId,
          adminName: adminData.name,
          institutionName: adminData.institutionName,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const completeAuthService = new CompleteAuthService();
export default completeAuthService;
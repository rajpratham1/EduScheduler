import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference,
  serverTimestamp,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import {
  Admin,
  AdminSecretCode,
  Faculty,
  Student,
  Department,
  Subject,
  Classroom,
  Schedule,
  Settings,
  StudentSignupRequest,
  Attendance,
  Assignment,
  AssignmentSubmission,
  Announcement,
  FeedbackForm,
  FeedbackResponse,
  QRCode,
  ClassFacultyAssignment,
  Analytics,
  AcademicTerm,
  Holiday,
  NotificationToken,
  AuditLog,
  ApiResponse,
  PaginatedResponse,
  AdminSignupFormData,
  StudentSignupFormData,
  FacultySignupFormData,
} from '../types/models';

interface QueryOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: { [key: string]: any };
}

class ComprehensiveFirebaseService {
  private async auditLog(action: string, resource: string, resourceId: string, details: any) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, 'audit_logs'), {
        userId: user.uid,
        action,
        resource,
        resourceId,
        details,
        ipAddress: 'unknown', // You might want to get this from a service
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
        adminId: user.uid, // Assuming current user is admin for now
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  private async generateUniqueSecretCode(): Promise<string> {
    let code: string;
    let exists: boolean;
    
    do {
      // Generate 8-digit alphanumeric code
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const q = query(collection(db, 'admin_secret_codes'), where('code', '==', code));
      const snapshot = await getDocs(q);
      exists = !snapshot.empty;
    } while (exists);
    
    return code;
  }

  // Authentication Services
  async signupAdmin(formData: AdminSignupFormData): Promise<ApiResponse<Admin>> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: formData.name });

      const secretCode = await this.generateUniqueSecretCode();

      const adminData: Omit<Admin, 'id'> = {
        name: formData.name,
        email: formData.email,
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

      await addDoc(collection(db, 'admins'), {
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

      await this.auditLog('CREATE', 'Admin', user.uid, { email: formData.email });

      return { success: true, data: { ...adminData, id: user.uid }, message: 'Admin created successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

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
        return { success: false, error: 'Invalid secret code' };
      }

      const secretCodeDoc = secretCodeSnapshot.docs[0];
      const secretCodeData = secretCodeDoc.data() as AdminSecretCode;

      // Create signup request
      const requestData: Omit<StudentSignupRequest, 'id'> = {
        name: formData.name,
        email: formData.email,
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

      await this.auditLog('CREATE', 'StudentSignupRequest', docRef.id, requestData);

      return { 
        success: true, 
        data: { ...requestData, id: docRef.id }, 
        message: 'Signup request submitted successfully. Please wait for admin approval.' 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async approveStudentSignup(requestId: string, password: string): Promise<ApiResponse<Student>> {
    try {
      const requestDoc = await getDoc(doc(db, 'student_signup_requests', requestId));
      if (!requestDoc.exists()) {
        return { success: false, error: 'Signup request not found' };
      }

      const requestData = requestDoc.data() as StudentSignupRequest;

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, requestData.email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: requestData.name });

      const studentData: Omit<Student, 'id'> = {
        uid: user.uid,
        name: requestData.name,
        rollNumber: requestData.rollNumber,
        department: requestData.department,
        semester: requestData.semester,
        email: requestData.email,
        contactNumber: requestData.contactNumber,
        dateOfBirth: new Date(),
        address: '',
        parentName: '',
        parentContactNumber: '',
        admissionDate: new Date(),
        status: 'approved',
        academicYear: '2024-25',
        emergencyContact: {
          name: '',
          relationship: '',
          contactNumber: '',
        },
        currentSubjects: [],
        attendance: {
          totalClasses: 0,
          attendedClasses: 0,
          percentage: 0,
        },
        adminId: requestData.adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'students'), {
        ...studentData,
        dateOfBirth: serverTimestamp(),
        admissionDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update request status
      await updateDoc(doc(db, 'student_signup_requests', requestId), {
        status: 'approved',
        reviewedBy: auth.currentUser?.uid,
        reviewedAt: serverTimestamp(),
      });

      // Update secret code usage
      const secretCodeQuery = query(
        collection(db, 'admin_secret_codes'),
        where('code', '==', requestData.secretCode)
      );
      const secretCodeSnapshot = await getDocs(secretCodeQuery);
      if (!secretCodeSnapshot.empty) {
        const secretCodeDoc = secretCodeSnapshot.docs[0];
        await updateDoc(secretCodeDoc.ref, {
          'usedBy.students': increment(1),
        });
      }

      await this.auditLog('APPROVE', 'StudentSignup', requestId, { studentId: user.uid });

      return { success: true, data: { ...studentData, id: user.uid }, message: 'Student approved successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Admin Services
  async getAdmin(adminId: string): Promise<ApiResponse<Admin>> {
    try {
      const adminDoc = await getDoc(doc(db, 'admins', adminId));
      if (!adminDoc.exists()) {
        return { success: false, error: 'Admin not found' };
      }

      const data = adminDoc.data();
      return {
        success: true,
        data: {
          ...data,
          id: adminDoc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Admin,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateAdmin(adminId: string, updateData: Partial<Admin>): Promise<ApiResponse<void>> {
    try {
      await updateDoc(doc(db, 'admins', adminId), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('UPDATE', 'Admin', adminId, updateData);
      return { success: true, message: 'Admin updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Faculty Services
  async createFaculty(facultyData: Omit<Faculty, 'id' | 'uid'>): Promise<ApiResponse<Faculty>> {
    try {
      const docRef = await addDoc(collection(db, 'faculty'), {
        ...facultyData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('CREATE', 'Faculty', docRef.id, facultyData);

      return {
        success: true,
        data: { ...facultyData, id: docRef.id, uid: '' } as Faculty,
        message: 'Faculty created successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getFaculty(adminId: string, options?: QueryOptions): Promise<ApiResponse<PaginatedResponse<Faculty>>> {
    try {
      const pageSize = options?.limit || 20;
      const pageNumber = options?.page || 1;

      let q = query(
        collection(db, 'faculty'),
        where('adminId', '==', adminId),
        orderBy(options?.orderBy || 'name', options?.orderDirection || 'asc'),
        limit(pageSize)
      );

      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            q = query(q, where(key, '==', value));
          }
        });
      }

      if (pageNumber > 1) {
        const offset = (pageNumber - 1) * pageSize;
        const offsetQuery = query(
          collection(db, 'faculty'),
          where('adminId', '==', adminId),
          orderBy(options?.orderBy || 'name', options?.orderDirection || 'asc'),
          limit(offset)
        );
        const offsetSnapshot = await getDocs(offsetQuery);
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const faculty = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Faculty[];

      // Get total count
      const totalQuery = query(collection(db, 'faculty'), where('adminId', '==', adminId));
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      return {
        success: true,
        data: {
          data: faculty,
          pagination: {
            page: pageNumber,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateFaculty(facultyId: string, updateData: Partial<Faculty>): Promise<ApiResponse<void>> {
    try {
      await updateDoc(doc(db, 'faculty', facultyId), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('UPDATE', 'Faculty', facultyId, updateData);
      return { success: true, message: 'Faculty updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteFaculty(facultyId: string): Promise<ApiResponse<void>> {
    try {
      await deleteDoc(doc(db, 'faculty', facultyId));
      await this.auditLog('DELETE', 'Faculty', facultyId, {});
      return { success: true, message: 'Faculty deleted successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Student Services
  async getStudents(adminId: string, options?: QueryOptions): Promise<ApiResponse<PaginatedResponse<Student>>> {
    try {
      const pageSize = options?.limit || 20;
      const pageNumber = options?.page || 1;

      let q = query(
        collection(db, 'students'),
        where('adminId', '==', adminId),
        orderBy(options?.orderBy || 'name', options?.orderDirection || 'asc'),
        limit(pageSize)
      );

      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            q = query(q, where(key, '==', value));
          }
        });
      }

      if (pageNumber > 1) {
        const offset = (pageNumber - 1) * pageSize;
        const offsetQuery = query(
          collection(db, 'students'),
          where('adminId', '==', adminId),
          orderBy(options?.orderBy || 'name', options?.orderDirection || 'asc'),
          limit(offset)
        );
        const offsetSnapshot = await getDocs(offsetQuery);
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const students = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        dateOfBirth: doc.data().dateOfBirth?.toDate(),
        admissionDate: doc.data().admissionDate?.toDate(),
      })) as Student[];

      // Get total count
      const totalQuery = query(collection(db, 'students'), where('adminId', '==', adminId));
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      return {
        success: true,
        data: {
          data: students,
          pagination: {
            page: pageNumber,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateStudent(studentId: string, updateData: Partial<Student>): Promise<ApiResponse<void>> {
    try {
      await updateDoc(doc(db, 'students', studentId), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('UPDATE', 'Student', studentId, updateData);
      return { success: true, message: 'Student updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteStudent(studentId: string): Promise<ApiResponse<void>> {
    try {
      await deleteDoc(doc(db, 'students', studentId));
      await this.auditLog('DELETE', 'Student', studentId, {});
      return { success: true, message: 'Student deleted successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Department Services
  async createDepartment(departmentData: Omit<Department, 'id'>): Promise<ApiResponse<Department>> {
    try {
      const docRef = await addDoc(collection(db, 'departments'), {
        ...departmentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('CREATE', 'Department', docRef.id, departmentData);

      return {
        success: true,
        data: { ...departmentData, id: docRef.id } as Department,
        message: 'Department created successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getDepartments(adminId: string): Promise<ApiResponse<Department[]>> {
    try {
      const q = query(
        collection(db, 'departments'),
        where('adminId', '==', adminId),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      const departments = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Department[];

      return { success: true, data: departments };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateDepartment(departmentId: string, updateData: Partial<Department>): Promise<ApiResponse<void>> {
    try {
      await updateDoc(doc(db, 'departments', departmentId), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('UPDATE', 'Department', departmentId, updateData);
      return { success: true, message: 'Department updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteDepartment(departmentId: string): Promise<ApiResponse<void>> {
    try {
      await deleteDoc(doc(db, 'departments', departmentId));
      await this.auditLog('DELETE', 'Department', departmentId, {});
      return { success: true, message: 'Department deleted successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Subject Services
  async createSubject(subjectData: Omit<Subject, 'id'>): Promise<ApiResponse<Subject>> {
    try {
      const docRef = await addDoc(collection(db, 'subjects'), {
        ...subjectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('CREATE', 'Subject', docRef.id, subjectData);

      return {
        success: true,
        data: { ...subjectData, id: docRef.id } as Subject,
        message: 'Subject created successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getSubjects(adminId: string, filters?: { department?: string; semester?: number }): Promise<ApiResponse<Subject[]>> {
    try {
      let q = query(
        collection(db, 'subjects'),
        where('adminId', '==', adminId),
        orderBy('name')
      );

      if (filters?.department) {
        q = query(q, where('department', '==', filters.department));
      }
      if (filters?.semester) {
        q = query(q, where('semester', '==', filters.semester));
      }

      const querySnapshot = await getDocs(q);
      const subjects = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Subject[];

      return { success: true, data: subjects };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateSubject(subjectId: string, updateData: Partial<Subject>): Promise<ApiResponse<void>> {
    try {
      await updateDoc(doc(db, 'subjects', subjectId), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('UPDATE', 'Subject', subjectId, updateData);
      return { success: true, message: 'Subject updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteSubject(subjectId: string): Promise<ApiResponse<void>> {
    try {
      await deleteDoc(doc(db, 'subjects', subjectId));
      await this.auditLog('DELETE', 'Subject', subjectId, {});
      return { success: true, message: 'Subject deleted successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Classroom Services
  async createClassroom(classroomData: Omit<Classroom, 'id'>): Promise<ApiResponse<Classroom>> {
    try {
      const docRef = await addDoc(collection(db, 'classrooms'), {
        ...classroomData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('CREATE', 'Classroom', docRef.id, classroomData);

      return {
        success: true,
        data: { ...classroomData, id: docRef.id } as Classroom,
        message: 'Classroom created successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getClassrooms(adminId: string): Promise<ApiResponse<Classroom[]>> {
    try {
      const q = query(
        collection(db, 'classrooms'),
        where('adminId', '==', adminId),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      const classrooms = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Classroom[];

      return { success: true, data: classrooms };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateClassroom(classroomId: string, updateData: Partial<Classroom>): Promise<ApiResponse<void>> {
    try {
      await updateDoc(doc(db, 'classrooms', classroomId), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('UPDATE', 'Classroom', classroomId, updateData);
      return { success: true, message: 'Classroom updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteClassroom(classroomId: string): Promise<ApiResponse<void>> {
    try {
      await deleteDoc(doc(db, 'classrooms', classroomId));
      await this.auditLog('DELETE', 'Classroom', classroomId, {});
      return { success: true, message: 'Classroom deleted successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Schedule Services
  async createSchedule(scheduleData: Omit<Schedule, 'id'>): Promise<ApiResponse<Schedule>> {
    try {
      const docRef = await addDoc(collection(db, 'schedules'), {
        ...scheduleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('CREATE', 'Schedule', docRef.id, scheduleData);

      return {
        success: true,
        data: { ...scheduleData, id: docRef.id } as Schedule,
        message: 'Schedule created successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getSchedules(adminId: string, filters?: { 
    department?: string; 
    semester?: number; 
    status?: 'draft' | 'published' 
  }): Promise<ApiResponse<Schedule[]>> {
    try {
      let q = query(
        collection(db, 'schedules'),
        where('adminId', '==', adminId),
        orderBy('createdAt', 'desc')
      );

      if (filters?.department) {
        q = query(q, where('department', '==', filters.department));
      }
      if (filters?.semester) {
        q = query(q, where('semester', '==', filters.semester));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const querySnapshot = await getDocs(q);
      const schedules = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Schedule[];

      return { success: true, data: schedules };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateSchedule(scheduleId: string, updateData: Partial<Schedule>): Promise<ApiResponse<void>> {
    try {
      await updateDoc(doc(db, 'schedules', scheduleId), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('UPDATE', 'Schedule', scheduleId, updateData);
      return { success: true, message: 'Schedule updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteSchedule(scheduleId: string): Promise<ApiResponse<void>> {
    try {
      await deleteDoc(doc(db, 'schedules', scheduleId));
      await this.auditLog('DELETE', 'Schedule', scheduleId, {});
      return { success: true, message: 'Schedule deleted successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Announcement Services
  async createAnnouncement(announcementData: Omit<Announcement, 'id'>): Promise<ApiResponse<Announcement>> {
    try {
      const docRef = await addDoc(collection(db, 'announcements'), {
        ...announcementData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('CREATE', 'Announcement', docRef.id, announcementData);

      return {
        success: true,
        data: { ...announcementData, id: docRef.id } as Announcement,
        message: 'Announcement created successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAnnouncements(adminId: string): Promise<ApiResponse<Announcement[]>> {
    try {
      const q = query(
        collection(db, 'announcements'),
        where('adminId', '==', adminId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const announcements = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        publishedAt: doc.data().publishedAt?.toDate(),
      })) as Announcement[];

      return { success: true, data: announcements };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Assignment Services
  async createAssignment(assignmentData: Omit<Assignment, 'id'>): Promise<ApiResponse<Assignment>> {
    try {
      const docRef = await addDoc(collection(db, 'assignments'), {
        ...assignmentData,
        dueDate: Timestamp.fromDate(assignmentData.dueDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.auditLog('CREATE', 'Assignment', docRef.id, assignmentData);

      return {
        success: true,
        data: { ...assignmentData, id: docRef.id } as Assignment,
        message: 'Assignment created successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAssignments(adminId: string, facultyId?: string): Promise<ApiResponse<Assignment[]>> {
    try {
      let q = query(
        collection(db, 'assignments'),
        where('adminId', '==', adminId),
        orderBy('createdAt', 'desc')
      );

      if (facultyId) {
        q = query(q, where('facultyId', '==', facultyId));
      }

      const querySnapshot = await getDocs(q);
      const assignments = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Assignment[];

      return { success: true, data: assignments };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // File Upload Service
  async uploadFile(file: File, path: string): Promise<ApiResponse<string>> {
    try {
      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return { success: true, data: downloadURL };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Bulk Operations
  async bulkCreateStudents(students: Omit<Student, 'id'>[]): Promise<ApiResponse<{ successful: number; failed: number; errors: string[] }>> {
    try {
      const batch = writeBatch(db);
      const errors: string[] = [];
      let successful = 0;

      students.forEach((student, index) => {
        try {
          const docRef = doc(collection(db, 'students'));
          batch.set(docRef, {
            ...student,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          successful++;
        } catch (error: any) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      });

      await batch.commit();

      return {
        success: true,
        data: {
          successful,
          failed: students.length - successful,
          errors,
        },
        message: `Bulk operation completed. ${successful} students created successfully.`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Search Services
  async searchStudents(adminId: string, searchTerm: string): Promise<ApiResponse<Student[]>> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation that searches by name and roll number
      // For production, consider using Algolia or similar service

      const nameQuery = query(
        collection(db, 'students'),
        where('adminId', '==', adminId),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );

      const rollQuery = query(
        collection(db, 'students'),
        where('adminId', '==', adminId),
        where('rollNumber', '>=', searchTerm),
        where('rollNumber', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );

      const [nameSnapshot, rollSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(rollQuery)
      ]);

      const students = new Map<string, Student>();

      nameSnapshot.docs.forEach(doc => {
        students.set(doc.id, {
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          dateOfBirth: doc.data().dateOfBirth?.toDate(),
          admissionDate: doc.data().admissionDate?.toDate(),
        } as Student);
      });

      rollSnapshot.docs.forEach(doc => {
        students.set(doc.id, {
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          dateOfBirth: doc.data().dateOfBirth?.toDate(),
          admissionDate: doc.data().admissionDate?.toDate(),
        } as Student);
      });

      return { success: true, data: Array.from(students.values()) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Analytics Services
  async getStudentAnalytics(adminId: string): Promise<ApiResponse<any>> {
    try {
      const studentsQuery = query(collection(db, 'students'), where('adminId', '==', adminId));
      const studentsSnapshot = await getDocs(studentsQuery);
      
      const departmentCounts: { [key: string]: number } = {};
      const semesterCounts: { [key: number]: number } = {};
      let totalStudents = 0;
      let activeStudents = 0;

      studentsSnapshot.docs.forEach(doc => {
        const student = doc.data() as Student;
        totalStudents++;
        
        if (student.status === 'approved') {
          activeStudents++;
        }

        departmentCounts[student.department] = (departmentCounts[student.department] || 0) + 1;
        semesterCounts[student.semester] = (semesterCounts[student.semester] || 0) + 1;
      });

      const analytics = {
        totalStudents,
        activeStudents,
        departmentDistribution: departmentCounts,
        semesterDistribution: semesterCounts,
        activePercentage: totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0,
      };

      return { success: true, data: analytics };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Export Services
  async exportStudents(adminId: string, format: 'csv' | 'json' = 'csv'): Promise<ApiResponse<string>> {
    try {
      const studentsResult = await this.getStudents(adminId);
      if (!studentsResult.success || !studentsResult.data) {
        return { success: false, error: 'Failed to fetch students' };
      }

      const students = studentsResult.data.data;

      if (format === 'json') {
        return { 
          success: true, 
          data: JSON.stringify(students, null, 2),
          message: 'Students exported successfully'
        };
      }

      // CSV format
      if (students.length === 0) {
        return { success: false, error: 'No students to export' };
      }

      const headers = [
        'Name', 'Roll Number', 'Email', 'Department', 'Semester', 
        'Contact Number', 'Status', 'Admission Date'
      ];
      
      const csvContent = [
        headers.join(','),
        ...students.map(student => [
          student.name,
          student.rollNumber,
          student.email,
          student.department,
          student.semester,
          student.contactNumber,
          student.status,
          student.admissionDate?.toISOString().split('T')[0] || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      return { 
        success: true, 
        data: csvContent,
        message: 'Students exported successfully'
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const comprehensiveFirebaseService = new ComprehensiveFirebaseService();
export default comprehensiveFirebaseService;
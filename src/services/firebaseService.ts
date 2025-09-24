import { auth } from '../config/firebase';
import apiService from './apiService';

// Type definitions
export interface Admin {
  id?: string;
  name: string;
  email: string;
  password: string;
  secretCode: string;
  createdAt: Date;
  isActive: boolean;
  institutionName?: string;
  institutionCode?: string;
}

export interface Faculty {
  id?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  departmentId: string;
  subjects: string[];
  employeeId: string;
  password: string;
  isAdmin: boolean;
  adminId: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Student {
  id?: string;
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  department: string;
  departmentId: string;
  classId: string;
  year: number;
  semester: number;
  adminId: string;
  createdAt: Date;
  status: string;
  isActive: boolean;
}

export interface Department {
  id?: string;
  name: string;
  code: string;
  head: string;
  adminId: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Subject {
  id?: string;
  name: string;
  code: string;
  credits: number;
  duration: number;
  type: 'theory' | 'practical';
  department: string;
  departmentId: string;
  adminId: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Classroom {
  id?: string;
  name: string;
  type: 'classroom' | 'lab' | 'library';
  capacity: number;
  building: string;
  floor: number;
  equipment: string[];
  department: string;
  departmentId: string;
  adminId: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Schedule {
  id?: string;
  subject: string;
  subjectId: string;
  facultyId: string;
  classroomId: string;
  department: string;
  departmentId: string;
  classId: string;
  year: number;
  semester: number;
  day: string;
  startTime: string;
  endTime: string;
  adminId: string;
  status: 'draft' | 'published';
  type: 'class' | 'exam';
  createdAt: Date;
}

export interface Assignment {
  id?: string;
  title: string;
  description: string;
  instructions?: string;
  facultyId: string;
  subjectId: string;
  classId: string;
  dueDate: any;
  maxMarks: number;
  allowedFileTypes: string[];
  status: 'draft' | 'published' | 'closed';
  createdAt: any;
  adminId: string;
  submissionsCount?: number;
  instructionFileUrl?: string;
}

export interface AssignmentSubmission {
  id?: string;
  assignmentId: string;
  studentId: string;
  facultyId: string;
  submissionFileUrl?: string;
  fileName?: string;
  fileSize?: number;
  submittedAt: any;
  status: 'submitted' | 'graded' | 'late';
  grade?: number;
  feedback?: string;
  gradedAt?: any;
  gradedBy?: string;
  adminId: string;
}

export interface Attendance {
  id?: string;
  studentId?: string;
  facultyId: string;
  subjectId: string;
  classId: string;
  date: any;
  startTime: string;
  endTime: string;
  status: 'present' | 'absent' | 'late';
  markedAt: any;
  qrId?: string;
  markedManually?: boolean;
  adminId: string;
  students: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late';
  }>;
}

export interface Settings {
  id?: string;
  classDuration: number;
  breakDuration: number;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  workingDays: string[];
  holidays: Date[];
  feedbackFormUrl: string;
  adminId: string;
}
// Firebase service class with API integration
class FirebaseService {
  // Map collection names to correct API endpoints
  private getEndpoint(collection: string): string {
    const endpointMap: Record<string, string> = {
      'admins': '/api/admin',
      'admin': '/api/admin',
      'faculty': '/api/faculty',
      'students': '/api/student',
      'student': '/api/student', 
      'departments': '/api/department',
      'department': '/api/department',
      'subjects': '/api/subject',
      'subject': '/api/subject',
      'classrooms': '/api/classroom',
      'classroom': '/api/classroom',
      'schedules': '/api/schedule',
      'schedule': '/api/schedule',
      'assignments': '/api/assignments',
      'assignment_submissions': '/api/assignments/submissions',
      'attendance': '/api/attendance',
      'announcements': '/api/announcements',
      'feedback': '/api/feedback',
      'settings': '/api/settings'
    };
    return endpointMap[collection] || `/api/${collection}`;
  }

  // Generic methods for API calls
  async getDocuments(collection: string, filters?: Array<{field: string, operator: string, value: any}>): Promise<any[]> {
    try {
      let endpoint = this.getEndpoint(collection);
      
      // Convert filters to query parameters if needed
      if (filters && filters.length > 0) {
        const params = new URLSearchParams();
        filters.forEach(filter => {
          if (filter.field === 'adminId' && auth.currentUser) {
            // Admin ID is handled by the backend through auth token
            return;
          }
          params.append(filter.field, filter.value);
        });
        if (params.toString()) {
          endpoint += `?${params.toString()}`;
        }
      }
      
      const response = await apiService.get(endpoint);
      return response.data || response || [];
    } catch (error) {
      console.error(`Error fetching ${collection}:`, error);
      return [];
    }
  }

  async getDocument(collection: string, id: string): Promise<any | null> {
    try {
      const endpoint = this.getEndpoint(collection);
      const response = await apiService.get(`${endpoint}/${id}`);
      return response.data || response || null;
    } catch (error) {
      console.error(`Error fetching ${collection} document:`, error);
      return null;
    }
  }

  async createDocument(collection: string, data: any): Promise<string> {
    try {
      const endpoint = this.getEndpoint(collection);
      const response = await apiService.post(endpoint, data);
      return response.data?.id || response.id || response.data?._id || response._id;
    } catch (error) {
      console.error(`Error creating ${collection} document:`, error);
      throw error;
    }
  }

  async updateDocument(collection: string, id: string, data: any): Promise<void> {
    try {
      const endpoint = this.getEndpoint(collection);
      await apiService.put(`${endpoint}/${id}`, data);
    } catch (error) {
      console.error(`Error updating ${collection} document:`, error);
      throw error;
    }
  }

  async deleteDocument(collection: string, id: string): Promise<void> {
    try {
      const endpoint = this.getEndpoint(collection);
      await apiService.delete(`${endpoint}/${id}`);
    } catch (error) {
      console.error(`Error deleting ${collection} document:`, error);
      throw error;
    }
  }

  // Admin operations
  async createAdmin(adminData: Omit<Admin, 'id' | 'createdAt'>): Promise<string> {
    return await this.createDocument('admins', adminData);
  }

  async getAdmins(): Promise<Admin[]> {
    return await this.getDocuments('admins');
  }

  // Faculty operations
  async createFaculty(facultyData: Omit<Faculty, 'id' | 'createdAt'>): Promise<string> {
    return await this.createDocument('faculty', facultyData);
  }

  async getFaculty(adminId?: string): Promise<Faculty[]> {
    const filters = adminId ? [{ field: 'adminId', operator: '==', value: adminId }] : undefined;
    return await this.getDocuments('faculty', filters);
  }

  async updateFaculty(id: string, facultyData: Partial<Faculty>): Promise<void> {
    return await this.updateDocument('faculty', id, facultyData);
  }

  async deleteFaculty(id: string): Promise<void> {
    return await this.deleteDocument('faculty', id);
  }

  // Student operations
  async createStudent(studentData: Omit<Student, 'id' | 'createdAt'>): Promise<string> {
    return await this.createDocument('students', studentData);
  }

  async getStudents(adminId?: string): Promise<Student[]> {
    const filters = adminId ? [{ field: 'adminId', operator: '==', value: adminId }] : undefined;
    return await this.getDocuments('students', filters);
  }

  async updateStudent(id: string, studentData: Partial<Student>): Promise<void> {
    return await this.updateDocument('students', id, studentData);
  }

  async deleteStudent(id: string): Promise<void> {
    return await this.deleteDocument('students', id);
  }

  // Department operations
  async createDepartment(departmentData: Omit<Department, 'id' | 'createdAt'>): Promise<string> {
    return await this.createDocument('departments', departmentData);
  }

  async getDepartments(adminId?: string): Promise<Department[]> {
    const filters = adminId ? [{ field: 'adminId', operator: '==', value: adminId }] : undefined;
    return await this.getDocuments('departments', filters);
  }

  async updateDepartment(id: string, departmentData: Partial<Department>): Promise<void> {
    return await this.updateDocument('departments', id, departmentData);
  }

  async deleteDepartment(id: string): Promise<void> {
    return await this.deleteDocument('departments', id);
  }

  // Subject operations
  async createSubject(subjectData: Omit<Subject, 'id' | 'createdAt'>): Promise<string> {
    return await this.createDocument('subjects', subjectData);
  }

  async getSubjects(adminId?: string): Promise<Subject[]> {
    const filters = adminId ? [{ field: 'adminId', operator: '==', value: adminId }] : undefined;
    return await this.getDocuments('subjects', filters);
  }

  async updateSubject(id: string, subjectData: Partial<Subject>): Promise<void> {
    return await this.updateDocument('subjects', id, subjectData);
  }

  async deleteSubject(id: string): Promise<void> {
    return await this.deleteDocument('subjects', id);
  }

  // Classroom operations
  async createClassroom(classroomData: Omit<Classroom, 'id' | 'createdAt'>): Promise<string> {
    return await this.createDocument('classrooms', classroomData);
  }

  async getClassrooms(adminId?: string): Promise<Classroom[]> {
    const filters = adminId ? [{ field: 'adminId', operator: '==', value: adminId }] : undefined;
    return await this.getDocuments('classrooms', filters);
  }

  async updateClassroom(id: string, classroomData: Partial<Classroom>): Promise<void> {
    return await this.updateDocument('classrooms', id, classroomData);
  }

  async deleteClassroom(id: string): Promise<void> {
    return await this.deleteDocument('classrooms', id);
  }

  // Schedule operations
  async createSchedule(scheduleData: Omit<Schedule, 'id' | 'createdAt'>): Promise<string> {
    return await this.createDocument('schedules', scheduleData);
  }

  async getSchedules(adminId: string): Promise<Schedule[]> {
    return await this.getDocuments('schedules', [{ field: 'adminId', operator: '==', value: adminId }]);
  }

  async getFacultySchedules(facultyId: string): Promise<Schedule[]> {
    return await this.getDocuments('schedules', [
      { field: 'facultyId', operator: '==', value: facultyId },
      { field: 'status', operator: '==', value: 'published' }
    ]);
  }

  async updateSchedule(id: string, scheduleData: Partial<Schedule>): Promise<void> {
    return await this.updateDocument('schedules', id, scheduleData);
  }

  async deleteSchedule(id: string): Promise<void> {
    return await this.deleteDocument('schedules', id);
  }

  async publishSchedules(adminId: string): Promise<void> {
    try {
      await apiService.post('/api/schedules/publish', { adminId });
    } catch (error) {
      console.error('Error publishing schedules:', error);
      throw error;
    }
  }

  // Settings operations
  async createSettings(settingsData: Omit<Settings, 'id'>): Promise<string> {
    return await this.createDocument('settings', settingsData);
  }

  async getSettings(adminId: string): Promise<Settings | null> {
    const settings = await this.getDocuments('settings', [{ field: 'adminId', operator: '==', value: adminId }]);
    return settings.length > 0 ? settings[0] : null;
  }

  async updateSettings(id: string, settingsData: Partial<Settings>): Promise<void> {
    return await this.updateDocument('settings', id, settingsData);
  }

  // Assignment operations
  async getAssignments(adminId?: string): Promise<Assignment[]> {
    const filters = adminId ? [{ field: 'adminId', operator: '==', value: adminId }] : undefined;
    return await this.getDocuments('assignments', filters);
  }

  async createAssignment(assignmentData: Omit<Assignment, 'id' | 'createdAt'>): Promise<string> {
    return await this.createDocument('assignments', assignmentData);
  }

  async updateAssignment(id: string, assignmentData: Partial<Assignment>): Promise<void> {
    return await this.updateDocument('assignments', id, assignmentData);
  }

  async deleteAssignment(id: string): Promise<void> {
    return await this.deleteDocument('assignments', id);
  }

  // Assignment submission operations
  async getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    return await this.getDocuments('assignment_submissions', [{ field: 'assignmentId', operator: '==', value: assignmentId }]);
  }

  async createAssignmentSubmission(submissionData: Omit<AssignmentSubmission, 'id' | 'submittedAt'>): Promise<string> {
    return await this.createDocument('assignment_submissions', submissionData);
  }

  async updateAssignmentSubmission(id: string, submissionData: Partial<AssignmentSubmission>): Promise<void> {
    return await this.updateDocument('assignment_submissions', id, submissionData);
  }

  // Attendance operations
  async getAttendance(adminId?: string): Promise<Attendance[]> {
    const filters = adminId ? [{ field: 'adminId', operator: '==', value: adminId }] : undefined;
    return await this.getDocuments('attendance', filters);
  }

  async createAttendance(attendanceData: Omit<Attendance, 'id' | 'markedAt'>): Promise<string> {
    return await this.createDocument('attendance', attendanceData);
  }

  async updateAttendance(id: string, attendanceData: Partial<Attendance>): Promise<void> {
    return await this.updateDocument('attendance', id, attendanceData);
  }

  async deleteAttendance(id: string): Promise<void> {
    return await this.deleteDocument('attendance', id);
  }

  // Announcements operations  
  async getAnnouncements(adminId?: string): Promise<any[]> {
    const filters = adminId ? [{ field: 'adminId', operator: '==', value: adminId }] : undefined;
    return await this.getDocuments('announcements', filters);
  }

  async createAnnouncement(announcementData: any): Promise<string> {
    return await this.createDocument('announcements', announcementData);
  }

  async updateAnnouncement(id: string, announcementData: any): Promise<void> {
    return await this.updateDocument('announcements', id, announcementData);
  }

  async deleteAnnouncement(id: string): Promise<void> {
    return await this.deleteDocument('announcements', id);
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();

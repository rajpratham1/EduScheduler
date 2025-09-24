export interface BaseModel {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  adminId: string; // Links all data to specific admin
}

export interface Admin extends BaseModel {
  name: string;
  email: string;
  role: 'admin';
  institutionName: string;
  institutionAddress: string;
  contactNumber: string;
  isActive: boolean;
  secretCode: string; // Unique secret code for this admin
  subscription: {
    plan: 'free' | 'basic' | 'premium';
    expiresAt: Date;
    maxStudents: number;
    maxFaculty: number;
  };
  settings: AdminSettings;
}

export interface AdminSecretCode extends BaseModel {
  code: string;
  isActive: boolean;
  usedBy: {
    students: number;
    faculty: number;
  };
  maxUsage?: number;
  expiresAt?: Date;
}

export interface Faculty extends BaseModel {
  uid: string; // Firebase Auth UID
  name: string;
  email: string;
  department: string;
  subjects: string[];
  designation: string;
  contactNumber?: string;
  joiningDate: Date;
  qualification: string;
  experience: number; // years
  isActive: boolean;
  employeeId: string;
  status: 'active' | 'inactive' | 'on_leave';
  workingHours: {
    start: string;
    end: string;
    workingDays: string[];
  };
  preferences: {
    preferredTimeSlots: string[];
    maxHoursPerDay: number;
    maxHoursPerWeek: number;
  };
}

export interface Student extends BaseModel {
  uid: string; // Firebase Auth UID
  name: string;
  rollNumber: string;
  department: string;
  semester: number;
  email: string;
  contactNumber: string;
  dateOfBirth: Date;
  address: string;
  parentName: string;
  parentContactNumber: string;
  parentEmail?: string;
  admissionDate: Date;
  status: 'pending' | 'approved' | 'suspended' | 'graduated';
  academicYear: string;
  bloodGroup?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    contactNumber: string;
  };
  currentSubjects: string[];
  attendance: {
    totalClasses: number;
    attendedClasses: number;
    percentage: number;
  };
}

export interface Department extends BaseModel {
  name: string;
  code: string;
  headOfDepartment: string;
  description: string;
  maxStudentsPerClass: number;
  totalSemesters: number;
}

export interface Subject extends BaseModel {
  name: string;
  code: string;
  department: string;
  semester: number;
  credits: number;
  description?: string;
  hoursPerWeek: number;
  requiresLab: boolean;
  prerequisites: string[];
  type: 'theory' | 'practical';
  duration: number;
}

export interface Classroom extends BaseModel {
  name: string;
  building: string;
  floor: number;
  roomNumber: string;
  capacity: number;
  type: string;
  facilities: string[];
  isLab: boolean;
  department: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  subject: string;
  faculty: string;
  classroom: string;
}

export interface DaySchedule {
  [key: string]: TimeSlot[];
}

export interface Schedule extends BaseModel {
  department: string;
  semester: number;
  weeklySchedule: {
    monday: TimeSlot[];
    tuesday: TimeSlot[];
    wednesday: TimeSlot[];
    thursday: TimeSlot[];
    friday: TimeSlot[];
    saturday?: TimeSlot[];
    sunday?: TimeSlot[];
  };
  constraints: any[];
  preferredTimings: any;
  status: 'draft' | 'published';
  generatedBy: string;
}

export interface AdminSettings {
  classDuration: number; // minutes
  breakDuration: number; // minutes
  lunchBreakStart: string;
  lunchBreakEnd: string;
  workingDays: string[];
  academicYear: {
    start: Date;
    end: Date;
    name: string;
  };
  timeSlots: {
    start: string;
    end: string;
    duration: number;
  }[];
  maxClassesPerDay: number;
  enableAttendance: boolean;
  enableAssignments: boolean;
  enableAnnouncements: boolean;
  theme: 'light' | 'dark';
  language: 'en' | 'hi' | 'es' | 'fr';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface Settings extends BaseModel {
  classDuration: number;
  breakDuration: number;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  workingDays: string[];
  holidays: Date[];
  feedbackFormUrl: string;
}

export interface StudentSignupRequest extends BaseModel {
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  semester: number;
  contactNumber: string;
  secretCode: string; // Admin's secret code
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface Attendance extends BaseModel {
  studentId: string;
  facultyId: string;
  subjectId: string;
  classroomId: string;
  date: Date;
  timeSlot: string;
  status: 'present' | 'absent' | 'late';
  markedAt: Date;
  markedBy: string;
  latitude?: number;
  longitude?: number;
  method: 'manual' | 'qr' | 'face_recognition';
}

export interface Assignment extends BaseModel {
  title: string;
  description: string;
  facultyId: string;
  subjectId: string;
  department: string;
  semester: number;
  dueDate: Date;
  totalMarks: number;
  instructions: string;
  attachments: {
    name: string;
    url: string;
    type: string;
  }[];
  status: 'draft' | 'published' | 'completed';
  submissions: number;
  isGraded: boolean;
}

export interface AssignmentSubmission extends BaseModel {
  assignmentId: string;
  studentId: string;
  submittedAt: Date;
  content: string;
  attachments: {
    name: string;
    url: string;
    type: string;
  }[];
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
  gradedBy?: string;
  gradedAt?: Date;
}

export interface Announcement extends BaseModel {
  title: string;
  content: string;
  authorId: string;
  authorType: 'admin' | 'faculty';
  targetAudience: {
    type: 'all' | 'department' | 'semester' | 'specific';
    departments?: string[];
    semesters?: number[];
    studentIds?: string[];
    facultyIds?: string[];
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments: {
    name: string;
    url: string;
    type: string;
  }[];
  isPublished: boolean;
  publishedAt?: Date;
  readBy: {
    userId: string;
    readAt: Date;
  }[];
}

export interface FeedbackForm extends BaseModel {
  title: string;
  description: string;
  questions: {
    id: string;
    text: string;
    type: 'text' | 'rating' | 'multiple_choice' | 'yes_no';
    options?: string[];
    required: boolean;
  }[];
  targetAudience: {
    type: 'all_students' | 'department' | 'semester' | 'subject';
    departments?: string[];
    semesters?: number[];
    subjectIds?: string[];
  };
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  responses: number;
}

export interface FeedbackResponse extends BaseModel {
  formId: string;
  studentId: string;
  responses: {
    questionId: string;
    answer: string | number | string[];
  }[];
  submittedAt: Date;
  isAnonymous: boolean;
}

export interface QRCode extends BaseModel {
  code: string;
  facultyId: string;
  subjectId: string;
  classroomId: string;
  date: Date;
  timeSlot: string;
  expiresAt: Date;
  isActive: boolean;
  scannedBy: {
    studentId: string;
    scannedAt: Date;
    latitude?: number;
    longitude?: number;
  }[];
}

export interface ClassFacultyAssignment extends BaseModel {
  facultyId: string;
  subjectId: string;
  department: string;
  semester: number;
  academicYear: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface Analytics extends BaseModel {
  type: 'attendance' | 'performance' | 'engagement' | 'faculty_workload';
  data: any;
  generatedBy: string;
  period: {
    start: Date;
    end: Date;
  };
  filters: {
    department?: string;
    semester?: number;
    subject?: string;
    faculty?: string;
  };
}

export interface AcademicTerm extends BaseModel {
  name: string;
  type: 'semester' | 'trimester' | 'quarter';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  examDates: {
    type: 'mid_term' | 'final' | 'assignment';
    startDate: Date;
    endDate: Date;
  }[];
}

export interface Holiday extends BaseModel {
  name: string;
  date: Date;
  type: 'national' | 'religious' | 'institutional';
  isOptional: boolean;
  description?: string;
}

export interface NotificationToken extends BaseModel {
  userId: string;
  token: string;
  deviceType: 'web' | 'android' | 'ios';
  isActive: boolean;
  lastUsed: Date;
}

export interface AuditLog extends BaseModel {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: { [key: string]: string[] };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface AdminSignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  institutionName: string;
  institutionAddress: string;
  contactNumber: string;
}

export interface StudentSignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  rollNumber: string;
  department: string;
  semester: number;
  contactNumber: string;
  dateOfBirth: Date;
  address: string;
  parentName: string;
  parentContactNumber: string;
  secretCode: string;
}

export interface FacultySignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  designation: string;
  qualification: string;
  experience: number;
  contactNumber: string;
  employeeId: string;
  secretCode: string;
}

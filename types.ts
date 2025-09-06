// types.ts

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  avatar: string;
  mobile_number?: string;
  forcePasswordChange: boolean;
}

export interface Student extends User {
    department_id: number;
}

export interface Faculty extends User {
    department_id: number;
}

export interface Department {
    id: number;
    name: string;
}

export interface Subject {
    id: number;
    name: string;
    weekly_hours: number;
    department_id: number;
}

export interface Classroom {
    id: number;
    name: string;
    type: string; // 'Lecture', 'Lab', 'Seminar'
    capacity: number;
}

export interface ClassSchedule {
    id: number; // Unique ID for a schedule entry instance
    day: string;
    time: string;
    subject_id: number;
    faculty_id: number;
    classroom_id: number;
}

export interface HydratedClassSchedule extends ClassSchedule {
    instance_id: string; // Unique ID for DnD
    subject: string;
    faculty: string;
    classroom: string;
}

export interface Conflict {
    type: 'Hard' | 'Soft';
    message: string;
    severity: 'error' | 'warning';
}

export interface PreviewUser {
    id: number;
    name: string;
    role: 'faculty' | 'student';
}

export interface Enrollment {
    id: number;
    student_id: number;
    subject_id: number;
}

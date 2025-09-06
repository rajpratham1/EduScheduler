// types.ts

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  avatar: string;
  forcePasswordChange?: boolean;
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

export interface Faculty {
    id: number;
    name: string;
    email: string;
    department_id: number;
}

export interface Student {
    id: number;
    name: string;
    email: string;
    department_id: number;
}

export interface Classroom {
    id: number;
    name: string;
    type: 'Lecture' | 'Lab' | 'Seminar' | string;
    capacity: number;
}

// Basic schedule entry from the database or AI generation
export interface ClassSchedule {
    id?: number; // Optional because new schedules might not have an ID yet
    day: string;
    time: string;
    subject_id: number;
    faculty_id: number;
    classroom_id: number;
}

// Enriched schedule entry with names for UI display
export interface HydratedClassSchedule extends ClassSchedule {
    instance_id: string; // Unique ID for React components (e.g., drag and drop)
    subject: string;
    faculty: string;
    classroom: string;
}

export interface Conflict {
    type: 'Hard' | 'Soft';
    message: string;
    severity: 'error' | 'warning';
}

export interface StudentEnrollment {
    id: number;
    student_id: number;
    subject_id: number;
}

// A simplified user object for the preview modal
export interface PreviewUser {
    id: number;
    name: string;
    role: 'student' | 'faculty';
}

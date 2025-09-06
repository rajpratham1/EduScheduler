// types.ts

export type Role = 'admin' | 'faculty' | 'student';
export type Page = 'login' | 'signup' | 'forgotPassword' | 'forcePasswordChange' | 'dashboard';

export interface User {
    id: number;
    name: string;
    email: string;
    mobile_number: string;
    role: Role;
    avatar: string; // key for AVATARS map
    force_password_change?: boolean;
}

// For schedule preview, we only need a subset of user info
export interface PreviewUser {
    id: number;
    name: string;
    role: 'faculty' | 'student';
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
    department_id: number;
}

export interface Student {
    id: number;
    name: string;
    department_id: number;
}

export interface Classroom {
    id: number;
    name: string;
    type: 'Lecture' | 'Lab' | 'Seminar';
    capacity: number;
}

export interface Enrollment {
    id: number;
    student_id: number;
    subject_id: number;
}

// The raw schedule data stored in the DB
export interface ClassSchedule {
    id?: number; // Optional as it might not exist before saving
    day: string;
    time: string;
    subject_id: number;
    faculty_id: number;
    classroom_id: number;
}

// The schedule data enriched with names for display
export interface HydratedClassSchedule extends ClassSchedule {
    instance_id: string; // A unique ID for React keys and dnd
    subject: string;
    faculty: string;
    classroom: string;
}

export interface Conflict {
    type: 'Hard' | 'Soft';
    message: string;
    severity: 'error' | 'warning';
}

export interface MockDb {
    users: User[];
    departments: Department[];
    subjects: Subject[];
    faculty: Faculty[];
    students: Student[];
    classrooms: Classroom[];
    enrollments: Enrollment[];
    schedules: {
        draft: ClassSchedule[];
        published: ClassSchedule[];
    };
    days_of_week: string[];
    time_slots: string[];
}

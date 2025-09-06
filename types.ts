// types.ts
export interface User {
    id: string; // Firestore document ID
    uid: string; // Firebase Auth UID
    name: string;
    email: string;
    role: 'admin' | 'faculty' | 'student';
    avatar: string;
    force_password_change: boolean;
    mobile_number: string;
}

export interface BaseEntity {
    id: string;
    name: string;
}

export interface Department extends BaseEntity {}

export interface Subject extends BaseEntity {
    weekly_hours: number;
    department_id: string;
}

export interface Faculty extends BaseEntity {
    email: string;
    mobile_number: string;
    department_id: string;
}

export interface Student extends BaseEntity {
    email: string;
    mobile_number: string;
    department_id: string;
    enrolled_subjects: string[]; // array of subject IDs
}

export interface Classroom extends BaseEntity {
    type: 'Lecture' | 'Lab' | 'Seminar';
    capacity: number;
}

export interface ClassSchedule {
    // No 'id' as it's part of an array in a single document
    day: string;
    time: string;
    subject_id: string;
    faculty_id: string;
    classroom_id: string;
}

export interface HydratedClassSchedule extends ClassSchedule {
    instance_id: string; // Unique ID for React keys and dnd
    subject: string;
    faculty: string;
    classroom: string;
}

export interface Enrollment {
    id: string;
    student_id: string;
    subject_id: string;
}

export interface Conflict {
    type: 'Hard' | 'Soft';
    message: string;
    severity: 'error' | 'warning';
}

export interface PreviewUser {
    id: string;
    name: string;
    role: 'student' | 'faculty';
}

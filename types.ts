// types.ts

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
}

export type PreviewUser = Pick<User, 'id' | 'name' | 'role' | 'email'>;

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

export interface Classroom {
    id: number;
    name: string;
    type: string;
    capacity: number;
}

export interface Student {
    id: number;
    name: string;
    email: string;
    department_id: number;
}

export interface Enrollment {
    id: number;
    student_id: number;
    subject_id: number;
}

export interface ClassSchedule {
    id: number;
    day: string; // e.g., 'Monday'
    time: string; // e.g., '9-10'
    subject_id: number;
    faculty_id: number;
    classroom_id: number;
}

// A "hydrated" version of ClassSchedule with names instead of just IDs
export interface HydratedClassSchedule extends ClassSchedule {
    instance_id: string; // Unique ID for drag-and-drop
    subject: string;
    faculty: string;
    classroom: string;
}

export interface Conflict {
    type: 'Hard' | 'Soft';
    message: string;
    severity: 'error' | 'warning';
}

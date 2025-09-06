// backend/mockDb.ts
import type { User, Department, Subject, Faculty, Student, Classroom, ClassSchedule, StudentEnrollment } from '../types';

interface Db {
    users: User[];
    departments: Department[];
    subjects: Subject[];
    faculty: Faculty[];
    students: Student[];
    classrooms: Classroom[];
    enrollments: StudentEnrollment[];
    daysOfWeek: string[];
    timeSlots: string[];
    draftSchedule: ClassSchedule[];
    publishedSchedule: ClassSchedule[];
}

const DB_KEY = 'eduscheduler_db';

const initialDb: Db = {
    users: [
        { id: 1, name: 'Admin User', email: 'admin@test.com', role: 'admin', avatar: 'avatar1' },
        { id: 2, name: 'Dr. Alan Grant', email: 'faculty@test.com', role: 'faculty', avatar: 'avatar2' },
        { id: 3, name: 'John Hammond', email: 'student@test.com', role: 'student', avatar: 'avatar3' },
        { id: 4, name: 'New User', email: 'new@test.com', role: 'student', avatar: 'avatar4', forcePasswordChange: true },
    ],
    departments: [
        { id: 1, name: 'Computer Science' },
        { id: 2, name: 'Physics' },
        { id: 3, name: 'Mathematics' },
    ],
    subjects: [
        { id: 1, name: 'Intro to Programming', weekly_hours: 3, department_id: 1 },
        { id: 2, name: 'Data Structures', weekly_hours: 4, department_id: 1 },
        { id: 3, name: 'Classical Mechanics', weekly_hours: 3, department_id: 2 },
        { id: 4, name: 'Calculus I', weekly_hours: 4, department_id: 3 },
    ],
    faculty: [
        { id: 1, name: 'Dr. Ian Malcolm', email: 'ian@test.com', department_id: 3 },
        { id: 2, name: 'Dr. Ellie Sattler', email: 'ellie@test.com', department_id: 1 },
        { id: 3, name: 'Dr. Henry Wu', email: 'henry@test.com', department_id: 2 },
    ],
    students: [
        { id: 1, name: 'Lex Murphy', email: 'lex@test.com', department_id: 1 },
        { id: 2, name: 'Tim Murphy', email: 'tim@test.com', department_id: 2 },
    ],
    classrooms: [
        { id: 1, name: 'Room 101', type: 'Lecture', capacity: 50 },
        { id: 2, name: 'Lab A', type: 'Lab', capacity: 25 },
        { id: 3, name: 'Hall C', type: 'Lecture', capacity: 100 },
    ],
    enrollments: [
        { id: 1, student_id: 3, subject_id: 1 },
        { id: 2, student_id: 3, subject_id: 4 },
        { id: 3, student_id: 1, subject_id: 3 },
    ],
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeSlots: ['9-10', '10-11', '11-12', '1-2', '2-3', '3-4'],
    draftSchedule: [],
    publishedSchedule: [
        // A minimal published schedule to start with
        { id: 1, day: 'Monday', time: '9-10', subject_id: 1, faculty_id: 2, classroom_id: 1 },
        { id: 2, day: 'Tuesday', time: '10-11', subject_id: 3, faculty_id: 3, classroom_id: 2 },
        { id: 3, day: 'Wednesday', time: '1-2', subject_id: 4, faculty_id: 1, classroom_id: 3 },
    ],
};

export const loadDb = (): Db => {
    try {
        const storedDb = localStorage.getItem(DB_KEY);
        if (storedDb) {
            // Basic check to see if shape is roughly correct
            const parsed = JSON.parse(storedDb);
            if (parsed.users && parsed.subjects) {
                 return parsed;
            }
        }
    } catch(e) {
        console.error("Failed to load DB from localStorage", e);
    }
    // If anything fails, reset to initial DB
    localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
    return initialDb;
}

export let db = loadDb();

export const saveDb = () => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

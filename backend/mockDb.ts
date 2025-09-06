// backend/mockDb.ts
import type { MockDb } from '../types.ts';

export const MOCK_DB: MockDb = {
    users: [
        { id: 1, name: 'Admin User', email: 'admin@test.com', mobile_number: '1234567890', role: 'admin', avatar: 'avatar1' },
        { id: 101, name: 'Dr. Alan Grant', email: 'alan@test.com', mobile_number: '1234567891', role: 'faculty', avatar: 'avatar2', force_password_change: true },
        { id: 102, name: 'Dr. Ellie Sattler', email: 'ellie@test.com', mobile_number: '1234567892', role: 'faculty', avatar: 'avatar3' },
        { id: 201, name: 'Lex Murphy', email: 'lex@test.com', mobile_number: '1234567893', role: 'student', avatar: 'avatar4' },
        { id: 202, name: 'Tim Murphy', email: 'tim@test.com', mobile_number: '1234567894', role: 'student', avatar: 'avatar5' },
    ],
    departments: [
        { id: 1, name: 'Computer Science' },
        { id: 2, name: 'Physics' },
        { id: 3, name: 'Biology' },
    ],
    subjects: [
        { id: 1, name: 'Introduction to Programming', weekly_hours: 3, department_id: 1 },
        { id: 2, name: 'Data Structures', weekly_hours: 4, department_id: 1 },
        { id: 3, name: 'Classical Mechanics', weekly_hours: 3, department_id: 2 },
        { id: 4, name: 'General Biology', weekly_hours: 4, department_id: 3 },
        { id: 5, name: 'Physics I', weekly_hours: 3, department_id: 2 },
    ],
    faculty: [
        { id: 101, name: 'Dr. Alan Grant', department_id: 2 },
        { id: 102, name: 'Dr. Ellie Sattler', department_id: 3 },
        { id: 3, name: 'Dr. Ian Malcolm', department_id: 1 },
    ],
    students: [
        { id: 201, name: 'Lex Murphy', department_id: 1 },
        { id: 202, name: 'Tim Murphy', department_id: 2 },
        { id: 3, name: 'John Hammond', department_id: 3 },
    ],
    classrooms: [
        { id: 1, name: 'Room 101', type: 'Lecture', capacity: 50 },
        { id: 2, name: 'Room 102', type: 'Lecture', capacity: 40 },
        { id: 3, name: 'Physics Lab A', type: 'Lab', capacity: 20 },
        { id: 4, name: 'Biology Lab B', type: 'Lab', capacity: 25 },
    ],
    enrollments: [
        { id: 1, student_id: 201, subject_id: 1 },
        { id: 2, student_id: 201, subject_id: 2 },
        { id: 3, student_id: 202, subject_id: 3 },
        { id: 4, student_id: 202, subject_id: 5 },
    ],
    schedules: {
        draft: [],
        published: [
            { id: 1, day: 'Monday', time: '9-10', subject_id: 1, faculty_id: 3, classroom_id: 1 },
            { id: 2, day: 'Monday', time: '10-11', subject_id: 3, faculty_id: 101, classroom_id: 2 },
            { id: 3, day: 'Tuesday', time: '11-12', subject_id: 4, faculty_id: 102, classroom_id: 4 },
        ],
    },
    days_of_week: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    time_slots: ['9-10', '10-11', '11-12', '1-2', '2-3', '3-4'],
};

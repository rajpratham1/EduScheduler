// backend/mockDb.ts
// This file contains the initial data for the mock database.
// It's used by services/storageService.ts to populate localStorage if it's empty.

export const MOCK_DB: { [key: string]: any[] } = {
    users: [
        { id: 1, name: 'Admin User', email: 'admin@test.com', role: 'admin', avatar: 'avatar1', forcePasswordChange: false },
        { id: 2, name: 'Dr. Alan Grant', email: 'alan.grant@test.com', role: 'faculty', department_id: 2, avatar: 'avatar2', forcePasswordChange: false },
        { id: 3, name: 'Dr. Ellie Sattler', email: 'ellie.sattler@test.com', role: 'faculty', department_id: 3, avatar: 'avatar3', forcePasswordChange: false },
        { id: 4, name: 'Dr. Ian Malcolm', email: 'ian.malcolm@test.com', role: 'faculty', department_id: 1, avatar: 'avatar4', forcePasswordChange: false },
        { id: 5, name: 'Lex Murphy', email: 'lex.murphy@test.com', role: 'student', department_id: 1, avatar: 'avatar5', forcePasswordChange: false },
        { id: 6, name: 'Tim Murphy', email: 'tim.murphy@test.com', role: 'student', department_id: 2, avatar: 'avatar1', forcePasswordChange: false },
    ],
    departments: [
        { id: 1, name: 'Computer Science' },
        { id: 2, name: 'Paleontology' },
        { id: 3, name: 'Botany' },
    ],
    subjects: [
        { id: 1, name: 'Chaos Theory', weekly_hours: 3, department_id: 1 },
        { id: 2, name: 'Systems Analysis', weekly_hours: 2, department_id: 1 },
        { id: 3, name: 'Fossil Identification', weekly_hours: 4, department_id: 2 },
        { id: 4, name: 'Paleobotany', weekly_hours: 3, department_id: 3 },
    ],
    classrooms: [
        { id: 1, name: 'Room 101', type: 'Lecture', capacity: 50 },
        { id: 2, name: 'Room 102', type: 'Lecture', capacity: 50 },
        { id: 3, name: 'Lab A', type: 'Lab', capacity: 20 },
        { id: 4, name: 'Lab B', type: 'Lab', capacity: 20 },
    ],
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeSlots: ['9-10', '10-11', '11-12', '1-2', '2-3', '3-4'],
    draftSchedule: [],
    publishedSchedule: [
        { id: 1, day: 'Monday', time: '9-10', subject_id: 1, faculty_id: 4, classroom_id: 1 },
        { id: 2, day: 'Monday', time: '10-11', subject_id: 3, faculty_id: 2, classroom_id: 3 },
        { id: 3, day: 'Tuesday', time: '11-12', subject_id: 4, faculty_id: 3, classroom_id: 4 },
    ],
    enrollments: [
        { id: 1, student_id: 5, subject_id: 1 },
        { id: 2, student_id: 5, subject_id: 2 },
        { id: 3, student_id: 6, subject_id: 3 },
        { id: 4, student_id: 6, subject_id: 4 },
    ],
};

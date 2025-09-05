// services/api.ts
import type { User, Subject, Faculty, Classroom, Student, Department, ClassSchedule, Enrollment } from '../types';
import db from '../database/db.json';

// --- In-memory mock database with localStorage persistence ---
const DB_KEY = 'eduscheduler_db';

let database = (() => {
    try {
        const storedDb = localStorage.getItem(DB_KEY);
        return storedDb ? JSON.parse(storedDb) : JSON.parse(JSON.stringify(db)); // Deep copy
    } catch (e) {
        return JSON.parse(JSON.stringify(db));
    }
})();

const persistDb = () => {
    localStorage.setItem(DB_KEY, JSON.stringify(database));
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Authentication ---
export const login = async (email: string): Promise<User | null> => {
    await delay(500);
    const user = database.users.find((u: User) => u.email === email);
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    }
    return null;
};

export const logout = (): void => {
    sessionStorage.removeItem('currentUser');
};

export const checkSession = async (): Promise<User | null> => {
    await delay(100);
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

// --- Schedule ---
export const getDraftSchedule = async (): Promise<ClassSchedule[]> => {
    await delay(200);
    return [...database.draft_class_schedule];
};

export const saveDraftSchedule = async (schedule: Omit<ClassSchedule, 'id'>[]): Promise<ClassSchedule[]> => {
    await delay(300);
    database.draft_class_schedule = schedule.map((s, i) => ({ ...s, id: i + 1 }));
    persistDb();
    return [...database.draft_class_schedule];
};

export const getLatestSchedule = async (): Promise<ClassSchedule[]> => {
    await delay(200);
    return [...database.published_class_schedule];
};

export const publishSchedule = async (): Promise<void> => {
    await delay(500);
    database.published_class_schedule = [...database.draft_class_schedule];
    persistDb();
};


// --- Data Getters ---
export const getSubjects = async (): Promise<Subject[]> => { await delay(100); return [...database.subjects]; };
export const getFaculty = async (): Promise<Faculty[]> => { await delay(100); return [...database.faculty]; };
export const getClassrooms = async (): Promise<Classroom[]> => { await delay(100); return [...database.classrooms]; };
export const getStudents = async (): Promise<Student[]> => { await delay(100); return [...database.students] };
export const getDepartments = async (): Promise<Department[]> => { await delay(100); return [...database.departments]};

export const getStudentEnrollments = async (studentId: number): Promise<Enrollment[]> => {
    await delay(150);
    return database.course_enrollments.filter((e: Enrollment) => e.student_id === studentId);
};

export const getAvailableFaculty = async (subjectId: number, day: string, time: string): Promise<Faculty[]> => {
    await delay(400);
    const subject = database.subjects.find((s: Subject) => s.id === subjectId);
    if (!subject) return [];

    const qualifiedFaculty = database.faculty.filter((f: Faculty) => f.department_id === subject.department_id);

    const busyFacultyIds = database.draft_class_schedule
        .filter((s: ClassSchedule) => s.day === day && s.time === time)
        .map((s: ClassSchedule) => s.faculty_id);

    return qualifiedFaculty.filter((f: Faculty) => !busyFacultyIds.includes(f.id));
};

// --- Full CRUD for Data Management ---
const createCrud = <T extends { id: number }>(tableName: keyof typeof database) => ({
    getAll: async (): Promise<T[]> => {
        await delay(300);
        return [...(database[tableName] as T[])];
    },
    add: async (itemData: Omit<T, 'id'>): Promise<T> => {
        await delay(200);
        const newItem = { ...itemData, id: Date.now() } as T;
        (database[tableName] as T[]).push(newItem);
        persistDb();
        return newItem;
    },
    delete: async (id: number): Promise<void> => {
        await delay(200);
        (database[tableName] as T[]) = (database[tableName] as T[]).filter((item: T) => item.id !== id);
        persistDb();
    },
});

export const facultyApi = createCrud<Faculty>('faculty');
export const studentApi = createCrud<Student>('students');
export const subjectApi = createCrud<Subject>('subjects');
export const classroomApi = createCrud<Classroom>('classrooms');
export const departmentApi = createCrud<Department>('departments');
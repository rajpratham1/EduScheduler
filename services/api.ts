// services/api.ts
import { db, saveDb } from '../backend/mockDb';
import type { User, Subject, Faculty, Student, Classroom, Department, ClassSchedule, StudentEnrollment } from '../types';

const SESSION_KEY = 'eduscheduler_session';

// --- Auth ---

export const checkSession = async (): Promise<User | null> => {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    const { userId } = JSON.parse(session);
    return db.users.find(u => u.id === userId) || null;
};

export const login = async (email: string, password: string): Promise<User | null> => {
    // Note: Password check is insecure and for mock purposes only
    const user = db.users.find(u => u.email === email);
    if (user) {
        // Mock password check: a forced-change user has a default pass, others have a standard mock pass
        const tempPassword = user.name.toLowerCase().replace(/\s/g, '') + '123';
        const standardPassword = `password_for_${user.id}`; // A predictable mock password
        
        // This logic is simplified for the mock environment.
        if ((user.forcePasswordChange && password === tempPassword) || (!user.forcePasswordChange && password === 'password')) {
             localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
             return user;
        }
    }
    await new Promise(res => setTimeout(res, 500)); // Simulate network delay for failed attempts
    return null;
};

export const logout = (): void => {
    localStorage.removeItem(SESSION_KEY);
};

export const sendOtp = async (mobile: string): Promise<void> => {
    console.log(`Sending OTP to ${mobile}. Mock OTP is 123456`);
    await new Promise(res => setTimeout(res, 500)); // Simulate network delay
};

export const signUp = async (userData: Omit<User, 'id' | 'avatar' | 'forcePasswordChange'>): Promise<User> => {
    if (db.users.some(u => u.email === userData.email)) {
        throw new Error("An account with this email already exists.");
    }
    const newUser: User = {
        ...userData,
        id: Date.now(),
        avatar: 'avatar1'
    };
    db.users.push(newUser);
    saveDb();
    return newUser;
};

export const requestPasswordReset = async (email: string): Promise<void> => {
    if (!db.users.some(u => u.email === email)) {
        throw new Error("User not found");
    }
    console.log(`Sent password reset to ${email}. Code is 'reset123'`);
    await new Promise(res => setTimeout(res, 500));
};

export const resetPassword = async (email: string, newPass: string, code: string): Promise<void> => {
    if (code !== 'reset123') {
        throw new Error("Invalid reset code");
    }
    const user = db.users.find(u => u.email === email);
    if (user) {
        console.log(`Password for ${email} reset.`);
        // In a real app, this would update the password hash.
        await new Promise(res => setTimeout(res, 500));
    } else {
        throw new Error("User not found");
    }
};

// --- User Management ---

export const updateUserProfile = async (userId: number, updates: { name?: string; avatar?: string }): Promise<User> => {
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    if (updates.name) user.name = updates.name;
    if (updates.avatar) user.avatar = updates.avatar;
    saveDb();
    return user;
};

export const changePassword = async (userId: number, oldPass: string, newPass: string): Promise<void> => {
    // This is a highly simplified mock. In a real app, never handle passwords this way.
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    
    // Clear the force password change flag if it was set
    if(user.forcePasswordChange) {
        user.forcePasswordChange = false;
    }

    saveDb();
    console.log(`Password changed for user ${userId}.`);
    await new Promise(res => setTimeout(res, 500));
};

// --- Generic CRUD Factory ---
const createApi = <T extends { id: number }>(key: keyof Omit<Db, 'daysOfWeek' | 'timeSlots' | 'draftSchedule' | 'publishedSchedule'>) => {
    const dataSet = db[key] as T[];
    return {
        getAll: async (): Promise<T[]> => [...dataSet],
        get: async (id: number): Promise<T | undefined> => dataSet.find(item => item.id === id),
        add: async (itemData: Omit<T, 'id'>): Promise<T> => {
            const newItem = { ...itemData, id: Date.now() } as T;
            dataSet.push(newItem);
            saveDb();
            return newItem;
        },
        update: async (id: number, updates: Partial<T>): Promise<T> => {
            const item = dataSet.find(i => i.id === id);
            if (!item) throw new Error("Item not found");
            Object.assign(item, updates);
            saveDb();
            return item;
        },
        delete: async (id: number): Promise<void> => {
            const index = dataSet.findIndex(i => i.id === id);
            if (index === -1) throw new Error("Item not found");
            dataSet.splice(index, 1);
            saveDb();
        },
    };
};

interface Db {
    users: User[];
    departments: Department[];
    subjects: Subject[];
    faculty: Faculty[];
    students: Student[];
    classrooms: Classroom[];
    enrollments: StudentEnrollment[];
}


export const subjectApi = createApi<Subject>('subjects');
export const facultyApi = createApi<Faculty>('faculty');
export const studentApi = createApi<Student>('students');
export const classroomApi = createApi<Classroom>('classrooms');
export const departmentApi = createApi<Department>('departments');

// --- Legacy direct exports for existing components ---
export const getSubjects = subjectApi.getAll;
export const getFaculty = facultyApi.getAll;
export const getClassrooms = classroomApi.getAll;
export const getStudents = studentApi.getAll;
export const getDepartments = departmentApi.getAll;


// --- Schedule Settings ---
export const getDaysOfWeek = async (): Promise<string[]> => [...db.daysOfWeek];
export const getTimeSlots = async (): Promise<string[]> => [...db.timeSlots];
export const addDayOfWeek = async (day: string): Promise<void> => { if(!db.daysOfWeek.includes(day)) { db.daysOfWeek.push(day); saveDb(); } };
export const removeDayOfWeek = async (day: string): Promise<void> => { db.daysOfWeek = db.daysOfWeek.filter(d => d !== day); saveDb(); };
export const addTimeSlot = async (slot: string): Promise<void> => { if(!db.timeSlots.includes(slot)) { db.timeSlots.push(slot); saveDb(); }};
export const removeTimeSlot = async (slot: string): Promise<void> => { db.timeSlots = db.timeSlots.filter(t => t !== slot); saveDb(); };

// --- Scheduling ---
export const getDraftSchedule = async (): Promise<ClassSchedule[]> => [...db.draftSchedule];
export const getLatestSchedule = async (): Promise<ClassSchedule[]> => [...db.publishedSchedule];
export const saveDraftSchedule = async (schedule: Omit<ClassSchedule, 'id'>[]): Promise<void> => {
    db.draftSchedule = schedule.map((s, i) => ({ ...s, id: i + 1 }));
    saveDb();
};
export const publishSchedule = async (): Promise<void> => {
    db.publishedSchedule = [...db.draftSchedule];
    saveDb();
};

// --- Specific Queries ---
export const getAvailableFaculty = async (subjectId: number, day: string, time: string): Promise<Faculty[]> => {
    const scheduledFacultyIds = new Set(db.draftSchedule
        .filter(s => s.day === day && s.time === time)
        .map(s => s.faculty_id));
    return db.faculty.filter(f => !scheduledFacultyIds.has(f.id));
};

export const getStudentEnrollments = async (studentId: number): Promise<StudentEnrollment[]> => {
    return db.enrollments.filter(e => e.student_id === studentId);
};

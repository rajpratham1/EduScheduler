// services/api.ts
import { storageService } from './storageService.ts';
import type { User, Subject, Faculty, Classroom, Department, ClassSchedule, Enrollment } from '../types.ts';

// --- Auth ---
export const checkSession = async (): Promise<User | null> => {
    const session = sessionStorage.getItem('session');
    if (session) {
        const { userId } = JSON.parse(session);
        const users = storageService.get('users');
        return users.find((u: User) => u.id === userId) || null;
    }
    return null;
};

export const login = async (email: string, password: string): Promise<User | null> => {
    const users = storageService.get('users');
    const user = users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
        // Mock password check - in real app, this would be a hash comparison
        // For newly created users, a special temp password is used.
        const tempPassword = user.name.toLowerCase().replace(/\s/g, '') + '123';
        if (password === 'password123' || (user.forcePasswordChange && password === tempPassword)) {
            sessionStorage.setItem('session', JSON.stringify({ userId: user.id }));
            return user;
        }
    }
    return null;
};

export const logout = () => {
    sessionStorage.removeItem('session');
};

export const signUp = async (userData: Omit<User, 'id' | 'avatar' | 'forcePasswordChange'> & { password?: string }) => {
    const users: User[] = storageService.get('users');
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error("An account with this email already exists.");
    }
    const newUser: User = {
        ...userData,
        id: storageService.getNextId('users'),
        avatar: 'avatar1',
        forcePasswordChange: false,
    };
    storageService.set('users', [...users, newUser]);
    return newUser;
};

export const sendOtp = async (mobile: string) => {
    // Mock OTP service
    console.log(`Sending OTP to ${mobile}. Mock OTP is 123456`);
    return { success: true };
};

export const requestPasswordReset = async (email: string) => {
     const users = storageService.get('users');
     if (!users.some((u: User) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("No account found");
     }
     console.log(`Password reset requested for ${email}. Mock code is 'reset123'`);
     return { success: true };
};

export const resetPassword = async (email: string, newPassword: string, code: string) => {
    if (code !== 'reset123') {
        throw new Error("Invalid reset code.");
    }
    // This is a mock; a real API would handle this securely.
    console.log(`Password for ${email} has been reset.`);
    return { success: true };
};

export const changePassword = async (userId: number, oldPassword: string, newPassword: string) => {
    // This is a highly simplified mock. A real backend would verify the old password.
    console.log(`Attempting to change password for user ${userId}`);
    const users: User[] = storageService.get('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users[userIndex].forcePasswordChange = false;
        storageService.set('users', users);
        return { success: true };
    }
    throw new Error("User not found.");
};

export const updateUserProfile = async (userId: number, profileData: { name: string, avatar: string }): Promise<User> => {
    const users: User[] = storageService.get('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...profileData };
        storageService.set('users', users);
        return users[userIndex];
    }
    throw new Error("User not found.");
};

// --- Data Fetching ---
export const getSubjects = async (): Promise<Subject[]> => storageService.get('subjects');
export const getFaculty = async (): Promise<Faculty[]> => storageService.get('users').filter((u: User) => u.role === 'faculty');
export const getStudents = async (): Promise<Student[]> => storageService.get('users').filter((u: User) => u.role === 'student');
export const getClassrooms = async (): Promise<Classroom[]> => storageService.get('classrooms');
export const getDepartments = async (): Promise<Department[]> => storageService.get('departments');
export const getDaysOfWeek = async (): Promise<string[]> => storageService.get('daysOfWeek');
export const getTimeSlots = async (): Promise<string[]> => storageService.get('timeSlots');
export const getLatestSchedule = async (): Promise<ClassSchedule[]> => storageService.get('publishedSchedule');
export const getDraftSchedule = async (): Promise<ClassSchedule[]> => storageService.get('draftSchedule');
export const getStudentEnrollments = async(studentId: number): Promise<Enrollment[]> => storageService.get('enrollments').filter((e: Enrollment) => e.student_id === studentId);

// --- Schedule Management ---
export const saveDraftSchedule = async (schedule: Omit<ClassSchedule, 'id'>[]) => {
    const scheduleWithIds = schedule.map((item, index) => ({...item, id: index + 1 }));
    storageService.set('draftSchedule', scheduleWithIds);
};
export const publishSchedule = async () => {
    const draft = storageService.get('draftSchedule');
    storageService.set('publishedSchedule', draft);
};

export const getAvailableFaculty = async (subjectId: number, day: string, time: string): Promise<Faculty[]> => {
    const allFaculty = await getFaculty();
    const schedule = storageService.get('draftSchedule');
    const busyFacultyIds = new Set(schedule.filter((s: ClassSchedule) => s.day === day && s.time === time).map((s: ClassSchedule) => s.faculty_id));
    return allFaculty.filter(f => !busyFacultyIds.has(f.id));
};

// --- CRUD APIs ---
const createCrudApi = <T extends { id: number }>(table: string) => ({
    getAll: async (): Promise<T[]> => storageService.get(table),
    add: async (item: Omit<T, 'id'>): Promise<T> => {
        const items = storageService.get(table);
        const newItem = { ...item, id: storageService.getNextId(table) } as T;
        storageService.set(table, [...items, newItem]);
        return newItem;
    },
    delete: async (id: number): Promise<void> => {
        const items = storageService.get(table);
        storageService.set(table, items.filter((item: T) => item.id !== id));
    },
});

export const subjectApi = createCrudApi<Subject>('subjects');
export const classroomApi = createCrudApi<Classroom>('classrooms');
export const departmentApi = createCrudApi<Department>('departments');

// Custom user CRUDS
const createUserApi = (role: 'faculty' | 'student') => ({
    getAll: async () => storageService.get('users').filter((u: User) => u.role === role),
    add: async (userData: { name: string, email: string, department_id: number }) => {
        const users: User[] = storageService.get('users');
        if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            throw new Error(`An account with email ${userData.email} already exists.`);
        }
        const newUser: User = {
            ...userData,
            id: storageService.getNextId('users'),
            role,
            avatar: 'avatar1',
            forcePasswordChange: true, // Admin-created users must change password
        };
        storageService.set('users', [...users, newUser]);
        return newUser;
    },
    delete: async (id: number) => {
        let users: User[] = storageService.get('users');
        users = users.filter(u => u.id !== id);
        storageService.set('users', users);
    }
});

export const facultyApi = createUserApi('faculty');
export const studentApi = createUserApi('student');

// --- Schedule Settings ---
export const addDayOfWeek = async (day: string) => {
    const days: string[] = storageService.get('daysOfWeek');
    if (!days.includes(day)) {
        storageService.set('daysOfWeek', [...days, day]);
    }
};
export const removeDayOfWeek = async (day: string) => {
    const days: string[] = storageService.get('daysOfWeek');
    storageService.set('daysOfWeek', days.filter(d => d !== day));
};
export const addTimeSlot = async (time: string) => {
    const times: string[] = storageService.get('timeSlots');
    if (!times.includes(time)) {
        storageService.set('timeSlots', [...times, time].sort((a,b) => parseInt(a.split('-')[0]) - parseInt(b.split('-')[0])));
    }
};
export const removeTimeSlot = async (time: string) => {
    const times: string[] = storageService.get('timeSlots');
    storageService.set('timeSlots', times.filter(t => t !== time));
};

// services/api.ts
import { storageService } from './storageService.ts';
import type { User, Subject, Faculty, Student, Classroom, ClassSchedule, Department, Enrollment } from '../types.ts';

// --- Utils ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Auth API ---

export const login = async (email: string, password: string): Promise<User | null> => {
    await delay(500);
    const users = storageService.get('users') as User[];
    const user = users.find(u => u.email === email);
    // Mock password check. In a real app, this is insecure.
    if (user) {
         // Special case for newly created users by admin
        const tempPassword = user.name.toLowerCase().replace(/\s/g, '') + '123';
        if (user.force_password_change && password === tempPassword) {
            return user;
        }
        // For regular users, mock password is 'password'
        if (!user.force_password_change && password === 'password') {
            return user;
        }
    }
    return null;
};

export const signUp = async (userData: Omit<User, 'id' | 'avatar'>): Promise<User> => {
    await delay(500);
    const users = storageService.get('users') as User[];
    if (users.some(u => u.email === userData.email)) {
        throw new Error("An account with this email already exists.");
    }
    const newId = storageService.getNextId('users');
    const newUser: User = { ...userData, id: newId, avatar: `avatar${(newId % 6) + 1}` };
    storageService.set('users', [...users, newUser]);
    return newUser;
};

export const sendOtp = async (mobile: string): Promise<{ success: true }> => {
    await delay(500);
    console.log(`Sending mock OTP to ${mobile}. Use 123456`);
    return { success: true };
};

export const changePassword = async (userId: number, oldPass: string, newPass: string): Promise<{ success: true }> => {
    await delay(500);
    const users = storageService.get('users') as User[];
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error("User not found.");
    }
    // This is a mock. In a real app, you'd securely verify the old password.
    // Here we just accept it if it's 'password' or the temp password.
    const tempPassword = users[userIndex].name.toLowerCase().replace(/\s/g, '') + '123';
    if (oldPass !== 'password' && oldPass !== tempPassword) {
         throw new Error("Incorrect old password.");
    }
    users[userIndex].force_password_change = false; // The password is now changed
    storageService.set('users', users);
    return { success: true };
};

export const updateUserProfile = async (userId: number, data: { name: string; avatar: string }): Promise<User> => {
    await delay(300);
    const users = storageService.get('users') as User[];
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    users[userIndex] = { ...users[userIndex], ...data };
    storageService.set('users', users);
    return users[userIndex];
};

// --- Generic CRUD Factory ---
const createCrudApi = <T extends { id: number }>(table: 'subjects' | 'faculty' | 'students' | 'classrooms' | 'departments' | 'enrollments') => ({
    getAll: async (): Promise<T[]> => {
        await delay(100);
        return storageService.get(table) as T[];
    },
    add: async (itemData: Omit<T, 'id'>): Promise<T> => {
        await delay(200);
        const items = storageService.get(table) as T[];
        const newId = storageService.getNextId(table);
        const newItem = { ...itemData, id: newId } as T;
        storageService.set(table, [...items, newItem]);
        return newItem;
    },
    delete: async (id: number): Promise<{ success: true }> => {
        await delay(200);
        const items = storageService.get(table) as T[];
        const filteredItems = items.filter(item => item.id !== id);
        if (items.length === filteredItems.length) {
            throw new Error(`${table} item with id ${id} not found.`);
        }
        storageService.set(table, filteredItems);
        return { success: true };
    },
});

// --- Specific Entity APIs ---
export const subjectApi = createCrudApi<Subject>('subjects');
export const facultyApi = createCrudApi<Faculty>('faculty');
export const studentApi = createCrudApi<Student>('students');
export const classroomApi = createCrudApi<Classroom>('classrooms');
export const departmentApi = createCrudApi<Department>('departments');
export const enrollmentApi = createCrudApi<Enrollment>('enrollments');

// For components that use `api.getSubjects()` etc directly
export const getSubjects = subjectApi.getAll;
export const getFaculty = facultyApi.getAll;
export const getStudents = studentApi.getAll;
export const getClassrooms = classroomApi.getAll;
export const getDepartments = departmentApi.getAll;

// --- Schedule API ---

export const getDraftSchedule = async (): Promise<ClassSchedule[]> => {
    await delay(100);
    const schedules = storageService.get('schedules') as { draft: ClassSchedule[], published: ClassSchedule[] };
    return schedules.draft;
};

export const saveDraftSchedule = async (schedule: Omit<ClassSchedule, 'id'>[]): Promise<{ success: true }> => {
    await delay(300);
    const schedules = storageService.get('schedules');
    schedules.draft = schedule;
    storageService.set('schedules', schedules);
    return { success: true };
};

export const getLatestSchedule = async (): Promise<ClassSchedule[]> => {
    await delay(100);
    const schedules = storageService.get('schedules') as { draft: ClassSchedule[], published: ClassSchedule[] };
    return schedules.published;
};

export const publishSchedule = async (): Promise<{ success: true }> => {
    await delay(500);
    const schedules = storageService.get('schedules');
    if (schedules.draft.length === 0) {
        throw new Error("Draft is empty, cannot publish.");
    }
    schedules.published = schedules.draft.map((item, index) => ({...item, id: index + 1 }));
    schedules.draft = [];
    storageService.set('schedules', schedules);
    return { success: true };
};

// --- Complex Queries ---
export const getAvailableFaculty = async (subjectId: number, day: string, time: string): Promise<Faculty[]> => {
    await delay(400);
    const [allFaculty, schedule] = await Promise.all([getFaculty(), getLatestSchedule()]);
    const busyFacultyIds = new Set(
        schedule.filter(s => s.day === day && s.time === time).map(s => s.faculty_id)
    );
    return allFaculty.filter(f => !busyFacultyIds.has(f.id));
};

export const getStudentEnrollments = async (studentId: number): Promise<Enrollment[]> => {
    const allEnrollments = await enrollmentApi.getAll();
    return allEnrollments.filter(e => e.student_id === studentId);
};

export const updateStudentEnrollments = async (studentId: number, subjectIds: number[]): Promise<Enrollment[]> => {
    await delay(300);
    let enrollments = await enrollmentApi.getAll();
    // Remove old enrollments for this student
    enrollments = enrollments.filter(e => e.student_id !== studentId);
    // Add new ones
    const newEnrollments = subjectIds.map(subject_id => ({
        id: Math.random(), // temp id, storage service will assign real one
        student_id: studentId,
        subject_id
    }));
    
    const finalEnrollments = [...enrollments];
    for (const enr of newEnrollments) {
        const {id, ...rest} = enr;
        const newEnr = await enrollmentApi.add(rest);
        finalEnrollments.push(newEnr);
    }

    return finalEnrollments.filter(e => e.student_id === studentId);
};

// --- Settings API ---
export const getDaysOfWeek = async (): Promise<string[]> => {
    await delay(50);
    return storageService.get('days_of_week') as string[];
};
export const addDayOfWeek = async (day: string): Promise<string[]> => {
    await delay(150);
    const days = await getDaysOfWeek();
    if (days.map(d => d.toLowerCase()).includes(day.toLowerCase())) throw new Error("Day already exists.");
    const newDays = [...days, day];
    storageService.set('days_of_week', newDays);
    return newDays;
};
export const removeDayOfWeek = async (day: string): Promise<string[]> => {
    await delay(150);
    const days = await getDaysOfWeek();
    const newDays = days.filter(d => d.toLowerCase() !== day.toLowerCase());
    storageService.set('days_of_week', newDays);
    return newDays;
};

export const getTimeSlots = async (): Promise<string[]> => {
    await delay(50);
    return storageService.get('time_slots') as string[];
};
export const addTimeSlot = async (time: string): Promise<string[]> => {
    await delay(150);
    const times = await getTimeSlots();
    if (times.includes(time)) throw new Error("Time slot already exists.");
    const newTimes = [...times, time];
    storageService.set('time_slots', newTimes);
    return newTimes;
};
export const removeTimeSlot = async (time: string): Promise<string[]> => {
    await delay(150);
    const times = await getTimeSlots();
    const newTimes = times.filter(t => t !== time);
    storageService.set('time_slots', newTimes);
    return newTimes;
};

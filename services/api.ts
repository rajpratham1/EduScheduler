// services/api.ts
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
    getDoc,
    setDoc,
    writeBatch,
    documentId
} from "firebase/firestore";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "firebase/auth";

import { db, auth } from './firebase.ts';
import type { User, Subject, Faculty, Student, Classroom, Department, Enrollment, ClassSchedule } from '../types.ts';

// --- Auth ---
export const login = async (email: string, password: string): Promise<User | null> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
            ...userData,
            id: userDoc.id,
            uid: userCredential.user.uid
        } as User;
    }
    return null;
};

export const logout = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

export const signUp = async (userData: any): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    
    // Create a corresponding user document in Firestore
    const userDocRef = doc(db, "users", userCredential.user.uid);
    await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        name: userData.name,
        email: userData.email,
        mobile_number: userData.mobile_number,
        role: userData.role,
        avatar: `avatar${Math.ceil(Math.random() * 6)}`,
        force_password_change: false,
    });
};

export const updateUserProfile = async (userId: string, updates: { name: string, avatar: string }): Promise<User> => {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, updates);

    const updatedDoc = await getDoc(userDocRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as User;
};

// FIX: Updated function to take old and new passwords for re-authentication.
export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    const user = auth.currentUser;
    if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, oldPassword);
        // Re-authenticate the user before changing the password
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        
        // If the user was forced to change their password, update the flag
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().force_password_change) {
            await updateDoc(userDocRef, { force_password_change: false });
        }
    } else {
        throw new Error("No authenticated user found or user has no email.");
    }
};

export const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
};

// --- Generic CRUD Factory ---
const createApi = <T extends { id: string }>(collectionName: string) => ({
    getAll: async (): Promise<T[]> => {
        const q = collection(db, collectionName);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    },
    add: async (newItem: Omit<T, 'id'>): Promise<T> => {
        const docRef = await addDoc(collection(db, collectionName), newItem);
        const newDoc = await getDoc(docRef);
        return { id: newDoc.id, ...newDoc.data() } as T;
    },
    delete: async (id: string): Promise<void> => {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
    },
});


// --- Specific APIs ---
export const subjectApi = createApi<Subject>('subjects');
export const classroomApi = createApi<Classroom>('classrooms');
export const departmentApi = createApi<Department>('departments');

// Note: Adding Faculty/Students only adds to Firestore. A Cloud Function handles creating the Auth user.
export const facultyApi = createApi<Faculty>('faculty');
export const studentApi = createApi<Student>('students');

export const getSubjects = subjectApi.getAll;
export const getClassrooms = classroomApi.getAll;
export const getDepartments = departmentApi.getAll;
export const getFaculty = facultyApi.getAll;
export const getStudents = studentApi.getAll;

// Custom delete logic for faculty/student to also delete the auth user (via Cloud Function in a real scenario, mocked here)
export const deleteFaculty = async (id: string): Promise<void> => {
    // In a real app, a Cloud Function would handle deleting the auth user.
    await facultyApi.delete(id);
};

export const deleteStudent = async (id: string): Promise<void> => {
    // In a real app, a Cloud Function would handle this.
    await studentApi.delete(id);
};

// --- Schedule Settings ---
export const getDaysOfWeek = async (): Promise<string[]> => {
    const docRef = doc(db, "settings", "daysOfWeek");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
};
export const saveDaysOfWeek = (days: string[]) => setDoc(doc(db, "settings", "daysOfWeek"), { days });

export const getTimeSlots = async (): Promise<string[]> => {
    const docRef = doc(db, "settings", "timeSlots");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().slots : ['9-10', '10-11', '11-12', '1-2', '2-3', '3-4'];
};
export const saveTimeSlots = (slots: string[]) => setDoc(doc(db, "settings", "timeSlots"), { slots });

// FIX: Add missing API functions for schedule settings management.
export const addDayOfWeek = async (day: string): Promise<void> => {
    const currentDays = await getDaysOfWeek();
    if (!currentDays.includes(day)) {
        await saveDaysOfWeek([...currentDays, day]);
    }
};

export const removeDayOfWeek = async (dayToRemove: string): Promise<void> => {
    const currentDays = await getDaysOfWeek();
    await saveDaysOfWeek(currentDays.filter(day => day !== dayToRemove));
};

export const addTimeSlot = async (slot: string): Promise<void> => {
    const currentSlots = await getTimeSlots();
    if (!currentSlots.includes(slot)) {
        const newSlots = [...currentSlots, slot];
        newSlots.sort((a, b) => parseInt(a.split('-')[0]) - parseInt(b.split('-')[0]));
        await saveTimeSlots(newSlots);
    }
};

export const removeTimeSlot = async (slotToRemove: string): Promise<void> => {
    const currentSlots = await getTimeSlots();
    await saveTimeSlots(currentSlots.filter(slot => slot !== slotToRemove));
};


// --- Schedule Management ---
const getSchedule = async (name: 'draft' | 'published'): Promise<ClassSchedule[]> => {
    const docRef = doc(db, "schedules", name);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().schedule : [];
}

export const getDraftSchedule = () => getSchedule('draft');
export const getLatestSchedule = () => getSchedule('published');
export const saveDraftSchedule = (schedule: Omit<ClassSchedule, 'id'>[]) => setDoc(doc(db, "schedules", "draft"), { schedule });

export const publishSchedule = async (): Promise<void> => {
    const draft = await getDraftSchedule();
    await setDoc(doc(db, "schedules", "published"), { schedule: draft });
    await setDoc(doc(db, "schedules", "draft"), { schedule: [] });
};

// --- Other ---
export const getStudentEnrollments = async (studentId: string): Promise<string[]> => {
     const docRef = doc(db, "students", studentId);
     const docSnap = await getDoc(docRef);
     return docSnap.exists() ? docSnap.data().enrolled_subjects || [] : [];
};

export const getAvailableFaculty = async (subjectId: string, day: string, time: string): Promise<Faculty[]> => {
    const allFaculty = await getFaculty();
    const schedule = await getDraftSchedule();
    const busyFacultyIds = new Set(
        schedule.filter(s => s.day === day && s.time === time).map(s => s.faculty_id)
    );
    return allFaculty.filter(f => !busyFacultyIds.has(f.id));
};
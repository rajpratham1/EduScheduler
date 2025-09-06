// services/storageService.ts
// FIX: Add file extension to import
import { MOCK_DB } from '../backend/mockDb.ts';
import type { MockDb } from '../types.ts';

const DB_KEY = 'eduSchedulerDb';

const getDb = (): MockDb => {
    try {
        const dbString = localStorage.getItem(DB_KEY);
        if (dbString) {
            return JSON.parse(dbString);
        }
    } catch (error) {
        console.error("Could not parse DB from localStorage", error);
    }
    // Initialize with mock data if not present
    const initialDb = MOCK_DB;
    localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
    return initialDb;
};

const saveDb = (db: any) => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (error) {
        console.error("Could not save DB to localStorage", error);
    }
};

type TableName = keyof MockDb;

export const storageService = {
    get: (table: TableName) => {
        const db = getDb();
        return db[table] || [];
    },
    set: (table: TableName, data: any) => {
        const db = getDb();
        db[table] = data;
        saveDb(db);
    },
    // Simple auto-incrementing ID for new items
    getNextId: (table: Extract<TableName, 'users' | 'departments' | 'subjects' | 'faculty' | 'students' | 'classrooms' | 'enrollments'>) => {
        const items = storageService.get(table) as { id: number }[];
        if (items.length === 0) return 1;
        return Math.max(...items.map((item: any) => item.id)) + 1;
    }
};

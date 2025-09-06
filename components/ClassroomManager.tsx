// components/ClassroomManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classroomApi } from '../services/api.ts';
import type { Classroom } from '../types.ts';
import { BuildingOfficeIcon, TrashIcon, MagnifyingGlassIcon } from './icons.tsx';
import { SkeletonLoader } from './SkeletonLoader.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import { useToast } from '../contexts/ToastContext.tsx';

const ClassroomManager: React.FC = () => {
    const [classroomList, setClassroomList] = useState<Classroom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newClassroomName, setNewClassroomName] = useState('');
    const [newClassroomType, setNewClassroomType] = useState<'Lecture' | 'Lab' | 'Seminar'>('Lecture');
    const [newClassroomCapacity, setNewClassroomCapacity] = useState<number | string>(30);
    const [searchTerm, setSearchTerm] = useState('');
    const [classroomToDelete, setClassroomToDelete] = useState<Classroom | null>(null);
    const { addToast } = useToast();

    const loadData = useCallback(async () => {
        try {
            const classrooms = await classroomApi.getAll();
            setClassroomList(classrooms);
        } catch(err) {
            addToast("Failed to load classroom data.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        setIsLoading(true);
        loadData();
    }, [loadData]);

    const filteredClassrooms = useMemo(() => {
        return classroomList.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [classroomList, searchTerm]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassroomName || !newClassroomType || !newClassroomCapacity) return;

        // FIX: Changed tempId to a string to match the Classroom type.
        const tempId = Date.now().toString();
        const optimisticClassroom: Classroom = {
            id: tempId,
            name: newClassroomName,
            type: newClassroomType,
            capacity: Number(newClassroomCapacity)
        };

        setClassroomList(prev => [...prev, optimisticClassroom]);
        setNewClassroomName('');
        setNewClassroomType('Lecture');
        setNewClassroomCapacity(30);

        try {
            const { id, ...newClassroomData } = optimisticClassroom;
            const addedClassroom = await classroomApi.add(newClassroomData as Omit<Classroom, 'id'>);
            addToast("Classroom added!", "success");
            // FIX: Compare string IDs for optimistic update replacement.
            setClassroomList(prev => prev.map(c => c.id === tempId ? addedClassroom : c));
        } catch(err: any) {
            addToast(err.message || "Failed to add classroom.", "error");
            // FIX: Compare string IDs for optimistic update removal on failure.
            setClassroomList(prev => prev.filter(c => c.id !== tempId));
        }
    };

    const handleDelete = (classroom: Classroom) => {
        setClassroomToDelete(classroom);
    };

    const executeDelete = async () => {
        if (!classroomToDelete) return;

        const originalList = [...classroomList];
        setClassroomList(prev => prev.filter(c => c.id !== classroomToDelete.id));
        const classroomToDeleteId = classroomToDelete.id;
        setClassroomToDelete(null);

        try {
            await classroomApi.delete(classroomToDeleteId);
            addToast("Classroom deleted.", "success");
        } catch(err: any) {
            addToast(err.message || "Failed to delete classroom.", "error");
            setClassroomList(originalList);
        }
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BuildingOfficeIcon className="w-6 h-6" />
                Classroom Management
            </h3>
            
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg">
                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                    <input value={newClassroomName} onChange={e => setNewClassroomName(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                    <select value={newClassroomType} onChange={e => setNewClassroomType(e.target.value as 'Lecture' | 'Lab' | 'Seminar')} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required>
                        <option>Lecture</option>
                        <option>Lab</option>
                        <option>Seminar</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Capacity</label>
                    <input type="number" min="1" value={newClassroomCapacity} onChange={e => setNewClassroomCapacity(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                <div className="sm:col-span-2">
                    <button type="submit" className="w-full sm:w-auto justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform">Add Classroom</button>
                </div>
            </form>

            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search classrooms..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-11 pr-5 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 sm:text-sm"
                />
            </div>

            <div className="max-h-60 overflow-y-auto pr-2">
                {isLoading ? <SkeletonLoader /> : (
                    <ul className="space-y-2">
                        <AnimatePresence>
                        {filteredClassrooms.length > 0 ? filteredClassrooms.map((classroom, i) => (
                            <motion.li key={classroom.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2, delay: i * 0.05 }} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700/50 border dark:border-slate-200 dark:border-slate-700 rounded-md">
                                <div>
                                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{classroom.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{classroom.type} - Capacity: {classroom.capacity}</p>
                                </div>
                                <button onClick={() => handleDelete(classroom)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </motion.li>
                        )) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                                 <BuildingOfficeIcon className="w-10 h-10 mx-auto text-slate-400" />
                                 <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No classrooms found.</p>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </ul>
                )}
            </div>
             <ConfirmationModal 
                isOpen={!!classroomToDelete}
                onClose={() => setClassroomToDelete(null)}
                onConfirm={executeDelete}
                title="Delete Classroom"
                message={`Are you sure you want to delete ${classroomToDelete?.name}?`}
            />
        </div>
    );
};

export default ClassroomManager;

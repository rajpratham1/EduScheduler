// components/SubjectManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../services/api.ts';
import type { Subject, Department } from '../types.ts';
import { BookOpenIcon, TrashIcon, MagnifyingGlassIcon } from './icons.tsx';
import { SkeletonLoader } from './SkeletonLoader.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import { useToast } from '../contexts/ToastContext.tsx';

const SubjectManager: React.FC = () => {
    const [subjectList, setSubjectList] = useState<Subject[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectHours, setNewSubjectHours] = useState<number | string>(3);
    // FIX: Changed selectedDepartmentId state to be a string.
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
    const { addToast } = useToast();

    const loadData = useCallback(async () => {
        try {
            const [subjects, depts] = await Promise.all([
                api.subjectApi.getAll(),
                api.getDepartments(),
            ]);
            setSubjectList(subjects);
            setDepartments(depts);
            if (depts.length > 0 && !selectedDepartmentId) {
                setSelectedDepartmentId(depts[0].id);
            }
        } catch(err) {
            addToast("Failed to load subject data.", "error");
        }
        finally {
            setIsLoading(false);
        }
    }, [selectedDepartmentId, addToast]);

    useEffect(() => {
        setIsLoading(true);
        loadData();
    }, [loadData]);

    const filteredSubjects = useMemo(() => {
        return subjectList.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [subjectList, searchTerm]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubjectName || !newSubjectHours || !selectedDepartmentId) return;
        
        // FIX: Changed tempId to a string to match the Subject type.
        const tempId = Date.now().toString();
        const optimisticSubject: Subject = {
            id: tempId,
            name: newSubjectName,
            weekly_hours: Number(newSubjectHours),
            // FIX: Use string value of selectedDepartmentId directly.
            department_id: selectedDepartmentId
        };

        setSubjectList(prev => [...prev, optimisticSubject]);
        setNewSubjectName('');
        setNewSubjectHours(3);

        try {
            const { id, ...newSubjectData } = optimisticSubject;
            const addedSubject = await api.subjectApi.add(newSubjectData as Omit<Subject, 'id'>);
            addToast("Subject added!", "success");
            // FIX: Compare string IDs for optimistic update replacement.
            setSubjectList(prev => prev.map(s => s.id === tempId ? addedSubject : s));
        } catch(err: any) {
            addToast(err.message || "Failed to add subject.", "error");
            // FIX: Compare string IDs for optimistic update removal on failure.
            setSubjectList(prev => prev.filter(s => s.id !== tempId));
        }
    };

    const handleDelete = (subject: Subject) => {
        setSubjectToDelete(subject);
    };

    const executeDelete = async () => {
        if (!subjectToDelete) return;

        const originalList = [...subjectList];
        setSubjectList(prev => prev.filter(s => s.id !== subjectToDelete.id));
        setSubjectToDelete(null);

        try {
            await api.subjectApi.delete(subjectToDelete.id);
            addToast("Subject deleted.", "success");
        } catch(err: any) {
            addToast(err.message || "Failed to delete subject.", "error");
            setSubjectList(originalList);
        }
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpenIcon className="w-6 h-6" />
                Subject Management
            </h3>
            
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg">
                <div className="sm:col-span-2">
                    <label htmlFor="subjectName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject Name</label>
                    <input id="subjectName" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                <div>
                    <label htmlFor="subjectHours" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Weekly Hours</label>
                    <input id="subjectHours" type="number" min="1" value={newSubjectHours} onChange={e => setNewSubjectHours(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                <div>
                    <label htmlFor="subjectDept" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                    {/* FIX: Removed Number() conversion from onChange handler. */}
                    <select id="subjectDept" value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="sm:col-span-2">
                    <button type="submit" className="w-full sm:w-auto justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform">Add Subject</button>
                </div>
            </form>

            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-11 pr-5 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 sm:text-sm"
                />
            </div>

            <div className="max-h-60 overflow-y-auto pr-2">
                {isLoading ? <SkeletonLoader /> : (
                    <ul className="space-y-2">
                        <AnimatePresence>
                        {filteredSubjects.length > 0 ? filteredSubjects.map((subject, i) => (
                            <motion.li key={subject.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2, delay: i * 0.05 }} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700/50 border dark:border-slate-200 dark:border-slate-700 rounded-md">
                                <div>
                                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{subject.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{subject.weekly_hours} hours/week</p>
                                </div>
                                <button onClick={() => handleDelete(subject)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </motion.li>
                        )) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                                 <BookOpenIcon className="w-10 h-10 mx-auto text-slate-400" />
                                 <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No subjects found.</p>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </ul>
                )}
            </div>
             <ConfirmationModal 
                isOpen={!!subjectToDelete}
                onClose={() => setSubjectToDelete(null)}
                onConfirm={executeDelete}
                title="Delete Subject"
                message={`Are you sure you want to delete ${subjectToDelete?.name}?`}
            />
        </div>
    );
};

export default SubjectManager;

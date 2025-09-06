// components/DepartmentManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { departmentApi } from '../services/api.ts';
import type { Department } from '../types.ts';
import { AcademicCapIcon, TrashIcon, MagnifyingGlassIcon } from './icons.tsx';
import { SkeletonLoader } from './SkeletonLoader.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import { useToast } from '../contexts/ToastContext.tsx';

const DepartmentManager: React.FC = () => {
    const [departmentList, setDepartmentList] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
    const { addToast } = useToast();

    const loadData = useCallback(async () => {
        try {
            const departments = await departmentApi.getAll();
            setDepartmentList(departments);
        } catch(err) {
            addToast("Failed to load department data.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        setIsLoading(true);
        loadData();
    }, [loadData]);

    const filteredDepartments = useMemo(() => {
        return departmentList.filter(d =>
            d.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [departmentList, searchTerm]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDepartmentName) return;
        
        // FIX: Changed tempId to a string to match the Department type.
        const tempId = Date.now().toString();
        const optimisticDepartment: Department = { id: tempId, name: newDepartmentName };

        setDepartmentList(prev => [...prev, optimisticDepartment]);
        setNewDepartmentName('');
        
        try {
            const addedDepartment = await departmentApi.add({ name: newDepartmentName });
            addToast("Department added!", "success");
            // FIX: Compare string IDs for optimistic update replacement.
            setDepartmentList(prev => prev.map(d => d.id === tempId ? addedDepartment : d));
        } catch(err: any) {
            addToast(err.message || "Failed to add department.", "error");
            // FIX: Compare string IDs for optimistic update removal on failure.
            setDepartmentList(prev => prev.filter(d => d.id !== tempId));
        }
    };

    const handleDelete = (department: Department) => {
        setDepartmentToDelete(department);
    };

    const executeDelete = async () => {
        if (!departmentToDelete) return;
        
        const originalList = [...departmentList];
        setDepartmentList(prev => prev.filter(d => d.id !== departmentToDelete.id));
        setDepartmentToDelete(null);

        try {
            await departmentApi.delete(departmentToDelete.id);
            addToast("Department deleted.", "success");
        } catch(err: any) {
            addToast(err.message || "Failed to delete department.", "error");
            setDepartmentList(originalList);
        }
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6" />
                Department Management
            </h3>
            
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg">
                <div className="flex-grow w-full">
                    <label htmlFor="departmentName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Department Name</label>
                    <input id="departmentName" value={newDepartmentName} onChange={e => setNewDepartmentName(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                <button type="submit" className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform w-full sm:w-auto">Add Department</button>
            </form>

            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-11 pr-5 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 sm:text-sm"
                />
            </div>

            <div className="max-h-60 overflow-y-auto pr-2">
                {isLoading ? <SkeletonLoader /> : (
                    <ul className="space-y-2">
                        <AnimatePresence>
                        {filteredDepartments.length > 0 ? filteredDepartments.map((department, i) => (
                            <motion.li key={department.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2, delay: i * 0.05 }} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700/50 border dark:border-slate-200 dark:border-slate-700 rounded-md">
                                <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{department.name}</p>
                                <button onClick={() => handleDelete(department)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </motion.li>
                        )) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                                 <AcademicCapIcon className="w-10 h-10 mx-auto text-slate-400" />
                                 <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No departments found.</p>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </ul>
                )}
            </div>
            <ConfirmationModal 
                isOpen={!!departmentToDelete}
                onClose={() => setDepartmentToDelete(null)}
                onConfirm={executeDelete}
                title="Delete Department"
                message={`Are you sure you want to delete ${departmentToDelete?.name}? This could affect related subjects, faculty, and students.`}
            />
        </div>
    );
};

export default DepartmentManager;

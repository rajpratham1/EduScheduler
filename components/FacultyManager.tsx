// components/FacultyManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { facultyApi } from '../services/api';
import * as api from '../services/api';
import type { Faculty, Department, PreviewUser } from '../types';
import { UserGroupIcon, TrashIcon, MagnifyingGlassIcon, EyeIcon } from './icons';
import { SkeletonLoader } from './SkeletonLoader';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import SchedulePreviewModal from './SchedulePreviewModal';

const FacultyManager: React.FC = () => {
    const [facultyList, setFacultyList] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newFacultyName, setNewFacultyName] = useState('');
    const [newFacultyEmail, setNewFacultyEmail] = useState('');
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [facultyToDelete, setFacultyToDelete] = useState<Faculty | null>(null);
    const [facultyToPreview, setFacultyToPreview] = useState<PreviewUser | null>(null);
    const { addToast } = useToast();

    const loadData = useCallback(async () => {
        try {
            const [faculty, depts] = await Promise.all([
                facultyApi.getAll(),
                api.getDepartments(),
            ]);
            setFacultyList(faculty);
            setDepartments(depts);
            if (depts.length > 0 && !selectedDepartmentId) {
                setSelectedDepartmentId(depts[0].id);
            }
        } catch (err) {
            addToast("Failed to load faculty data.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addToast, selectedDepartmentId]);

    useEffect(() => {
        setIsLoading(true);
        loadData();
    }, [loadData]);

    const filteredFaculty = useMemo(() => {
        return facultyList.filter(f =>
            f.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [facultyList, searchTerm]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFacultyName || !newFacultyEmail || !selectedDepartmentId) return;
        const newFacultyData = { name: newFacultyName, email: newFacultyEmail, department_id: Number(selectedDepartmentId) };
        try {
            const addedFaculty = await facultyApi.add(newFacultyData);
            setFacultyList(prev => [...prev, addedFaculty]);
            addToast("Faculty member added!", "success");
            setNewFacultyName('');
            setNewFacultyEmail('');
        } catch (err: any) {
            addToast(err.message || "Failed to add faculty member.", "error");
        }
    };

    const executeDelete = async () => {
        if (!facultyToDelete) return;
        try {
            await facultyApi.delete(facultyToDelete.id);
            setFacultyList(prev => prev.filter(f => f.id !== facultyToDelete.id));
            addToast("Faculty member deleted.", "success");
        } catch (err: any) {
            addToast(err.message || "Failed to delete faculty member.", "error");
        }
        setFacultyToDelete(null);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><UserGroupIcon className="w-6 h-6" />Faculty Management</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg">
                <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label><input value={newFacultyName} onChange={e => setNewFacultyName(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label><input type="email" value={newFacultyEmail} onChange={e => setNewFacultyEmail(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label><select value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(Number(e.target.value))} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                <div className="sm:col-span-2"><button type="submit" className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform">Add Faculty</button></div>
            </form>
            <div className="relative"><MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-slate-400" /><input type="text" placeholder="Search faculty..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-11 pr-5 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 sm:text-sm" /></div>
            <div className="max-h-60 overflow-y-auto pr-2">{isLoading ? <SkeletonLoader /> : <ul className="space-y-2"><AnimatePresence>{filteredFaculty.length > 0 ? filteredFaculty.map((faculty, i) => (<motion.li key={faculty.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2, delay: i * 0.05 }} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700/50 border dark:border-slate-200 dark:border-slate-700 rounded-md"><div><p className="font-medium text-sm text-slate-800 dark:text-slate-200">{faculty.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{departments.find(d => d.id === faculty.department_id)?.name}</p></div><div className="flex items-center gap-1"><button onClick={() => setFacultyToPreview({ ...faculty, role: 'faculty' })} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50"><EyeIcon className="w-4 h-4" /></button><button onClick={() => setFacultyToDelete(faculty)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><TrashIcon className="w-4 h-4" /></button></div></motion.li>)) : (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8"><UserGroupIcon className="w-10 h-10 mx-auto text-slate-400" /><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No faculty found.</p></motion.div>)}</AnimatePresence></ul>}</div>
            <ConfirmationModal isOpen={!!facultyToDelete} onClose={() => setFacultyToDelete(null)} onConfirm={executeDelete} title="Delete Faculty" message={`Are you sure you want to delete ${facultyToDelete?.name}?`} />
            <SchedulePreviewModal user={facultyToPreview} onClose={() => setFacultyToPreview(null)} />
        </div>
    );
};

export default FacultyManager;

// components/FacultyManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { facultyApi } from '../services/api';
import * as api from '../services/api';
import type { Faculty, Department, PreviewUser } from '../types';
import { UserGroupIcon, TrashIcon, MagnifyingGlassIcon, EyeIcon } from './icons';
import { SkeletonLoader } from './SkeletonLoader';
import SchedulePreviewModal from './SchedulePreviewModal';

const FacultyManager: React.FC = () => {
    const [facultyList, setFacultyList] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newFacultyName, setNewFacultyName] = useState('');
    const [newFacultyEmail, setNewFacultyEmail] = useState('');
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [previewUser, setPreviewUser] = useState<PreviewUser | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
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
        } catch (error) {
            console.error("Failed to load faculty data", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDepartmentId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredFaculty = useMemo(() => {
        return facultyList.filter(f =>
            f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [facultyList, searchTerm]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFacultyName || !newFacultyEmail || !selectedDepartmentId) return;
        
        const newFaculty = {
            name: newFacultyName,
            email: newFacultyEmail,
            department_id: Number(selectedDepartmentId),
        };
        
        await facultyApi.add(newFaculty);
        setNewFacultyName('');
        setNewFacultyEmail('');
        loadData();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this faculty member?')) {
            await facultyApi.delete(id);
            loadData();
        }
    };

    const handlePreviewSchedule = (faculty: Faculty) => {
        setPreviewUser({ id: faculty.id, name: faculty.name, email: faculty.email, role: 'faculty' });
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6" />
                Faculty Management
            </h3>
            
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg">
                 <div className="col-span-1 sm:col-span-2">
                    <label htmlFor="facultyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                    <input id="facultyName" value={newFacultyName} onChange={e => setNewFacultyName(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                 <div className="col-span-1 sm:col-span-2">
                    <label htmlFor="facultyEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <input id="facultyEmail" type="email" value={newFacultyEmail} onChange={e => setNewFacultyEmail(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                 <div>
                    <label htmlFor="facultyDept" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                    <select id="facultyDept" value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(Number(e.target.value))} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <button type="submit" className="w-full sm:w-auto justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform">Add Faculty</button>
            </form>
            
            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search faculty..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-11 pr-5 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 sm:text-sm"
                />
            </div>

            <div className="max-h-60 overflow-y-auto pr-2">
                {isLoading ? <SkeletonLoader /> : (
                    <ul className="space-y-2">
                        {filteredFaculty.length > 0 ? filteredFaculty.map(faculty => (
                            <li key={faculty.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700/50 border dark:border-slate-200 dark:border-slate-700 rounded-md transition-all duration-200 hover:shadow-md hover:scale-[1.02] animate-fadeInUp">
                                <div>
                                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{faculty.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{faculty.email}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handlePreviewSchedule(faculty)} title="Preview Schedule" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full">
                                        <EyeIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(faculty.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </li>
                        )) : (
                           <div className="text-center py-8 animate-fadeInUp">
                               <UserGroupIcon className="w-10 h-10 mx-auto text-slate-400" />
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No faculty found.</p>
                           </div>
                        )}
                    </ul>
                )}
            </div>
            <SchedulePreviewModal user={previewUser} onClose={() => setPreviewUser(null)} />
        </div>
    );
};

export default FacultyManager;

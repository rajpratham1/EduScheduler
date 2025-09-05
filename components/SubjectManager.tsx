// components/SubjectManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { subjectApi } from '../services/api';
import * as api from '../services/api';
import type { Subject, Department } from '../types';
import { BookOpenIcon, TrashIcon, MagnifyingGlassIcon } from './icons';
import { SkeletonLoader } from './SkeletonLoader';

const SubjectManager: React.FC = () => {
    const [subjectList, setSubjectList] = useState<Subject[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectHours, setNewSubjectHours] = useState<number | string>(3);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | string>('');
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [subjects, depts] = await Promise.all([
                subjectApi.getAll(),
                api.getDepartments(),
            ]);
            setSubjectList(subjects);
            setDepartments(depts);
            if (depts.length > 0 && !selectedDepartmentId) {
                setSelectedDepartmentId(depts[0].id);
            }
        } finally {
            setIsLoading(false);
        }
    }, [selectedDepartmentId]);

    useEffect(() => {
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
        await subjectApi.add({ name: newSubjectName, weekly_hours: Number(newSubjectHours), department_id: Number(selectedDepartmentId) });
        setNewSubjectName('');
        setNewSubjectHours(3);
        loadData();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            await subjectApi.delete(id);
            loadData();
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
                    <select id="subjectDept" value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(Number(e.target.value))} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required>
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
                        {filteredSubjects.length > 0 ? filteredSubjects.map(subject => (
                            <li key={subject.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700/50 border dark:border-slate-200 dark:border-slate-700 rounded-md transition-all duration-200 hover:shadow-md hover:scale-[1.02] animate-fadeInUp">
                                <div>
                                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{subject.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{subject.weekly_hours} hours/week</p>
                                </div>
                                <button onClick={() => handleDelete(subject.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        )) : (
                            <div className="text-center py-8 animate-fadeInUp">
                                 <BookOpenIcon className="w-10 h-10 mx-auto text-slate-400" />
                                 <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No subjects found.</p>
                            </div>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SubjectManager;

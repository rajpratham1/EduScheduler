// components/DepartmentManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { departmentApi } from '../services/api';
import type { Department } from '../types';
import { AcademicCapIcon, TrashIcon, MagnifyingGlassIcon } from './icons';
import { SkeletonLoader } from './SkeletonLoader';

const DepartmentManager: React.FC = () => {
    const [departmentList, setDepartmentList] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const departments = await departmentApi.getAll();
            setDepartmentList(departments);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
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
        await departmentApi.add({ name: newDepartmentName });
        setNewDepartmentName('');
        loadData();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this department? This could affect related subjects, faculty, and students.')) {
            await departmentApi.delete(id);
            loadData();
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
                        {filteredDepartments.length > 0 ? filteredDepartments.map(department => (
                            <li key={department.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700/50 border dark:border-slate-200 dark:border-slate-700 rounded-md transition-all duration-200 hover:shadow-md hover:scale-[1.02] animate-fadeInUp">
                                <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{department.name}</p>
                                <button onClick={() => handleDelete(department.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        )) : (
                            <div className="text-center py-8 animate-fadeInUp">
                                 <AcademicCapIcon className="w-10 h-10 mx-auto text-slate-400" />
                                 <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No departments found.</p>
                            </div>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default DepartmentManager;

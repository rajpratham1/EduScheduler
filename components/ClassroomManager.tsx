// components/ClassroomManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { classroomApi } from '../services/api';
import type { Classroom } from '../types';
import { BuildingOfficeIcon, TrashIcon, MagnifyingGlassIcon } from './icons';
import { SkeletonLoader } from './SkeletonLoader';

const ClassroomManager: React.FC = () => {
    const [classroomList, setClassroomList] = useState<Classroom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newClassroomName, setNewClassroomName] = useState('');
    const [newClassroomType, setNewClassroomType] = useState('Standard');
    const [newClassroomCapacity, setNewClassroomCapacity] = useState<number | string>(30);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const classrooms = await classroomApi.getAll();
            setClassroomList(classrooms);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredClassrooms = useMemo(() => {
        return classroomList.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [classroomList, searchTerm]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassroomName || !newClassroomType || !newClassroomCapacity) return;
        await classroomApi.add({ name: newClassroomName, type: newClassroomType, capacity: Number(newClassroomCapacity) });
        setNewClassroomName('');
        setNewClassroomType('Standard');
        setNewClassroomCapacity(30);
        loadData();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this classroom?')) {
            await classroomApi.delete(id);
            loadData();
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
                    <label htmlFor="classroomName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                    <input id="classroomName" value={newClassroomName} onChange={e => setNewClassroomName(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                <div>
                    <label htmlFor="classroomType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                    <input id="classroomType" value={newClassroomType} onChange={e => setNewClassroomType(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                <div>
                    <label htmlFor="classroomCapacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Capacity</label>
                    <input id="classroomCapacity" type="number" min="1" value={newClassroomCapacity} onChange={e => setNewClassroomCapacity(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
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
                        {filteredClassrooms.length > 0 ? filteredClassrooms.map(classroom => (
                            <li key={classroom.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700/50 border dark:border-slate-200 dark:border-slate-700 rounded-md transition-all duration-200 hover:shadow-md hover:scale-[1.02] animate-fadeInUp">
                                <div>
                                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{classroom.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{classroom.type} (Capacity: {classroom.capacity})</p>
                                </div>
                                <button onClick={() => handleDelete(classroom.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        )) : (
                            <div className="text-center py-8 animate-fadeInUp">
                                 <BuildingOfficeIcon className="w-10 h-10 mx-auto text-slate-400" />
                                 <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No classrooms found.</p>
                            </div>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ClassroomManager;

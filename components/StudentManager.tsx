// components/StudentManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { studentApi } from '../services/api';
import * as api from '../services/api';
import type { Student, Department, PreviewUser } from '../types';
import { UserGroupIcon, TrashIcon, EyeIcon, ChartPieIcon, MagnifyingGlassIcon } from './icons';
import SchedulePreviewModal from './SchedulePreviewModal';
import WorkloadAnalysisModal from './WorkloadAnalysisModal';
import { SkeletonLoader } from './SkeletonLoader';

const StudentManager: React.FC = () => {
    const [studentList, setStudentList] = useState<Student[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | string>('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [previewUser, setPreviewUser] = useState<PreviewUser | null>(null);
    const [analyzingStudent, setAnalyzingStudent] = useState<Student | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [students, depts] = await Promise.all([
                studentApi.getAll(),
                api.getDepartments(),
            ]);
            setStudentList(students);
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

    const filteredStudents = useMemo(() => {
        return studentList.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [studentList, searchTerm]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentName || !newStudentEmail || !selectedDepartmentId) return;
        await studentApi.add({ name: newStudentName, email: newStudentEmail, department_id: Number(selectedDepartmentId) });
        setNewStudentName('');
        setNewStudentEmail('');
        loadData();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            await studentApi.delete(id);
            loadData();
        }
    };
    
    const handlePreviewSchedule = (student: Student) => {
        setPreviewUser({ id: student.id, name: student.name, email: student.email, role: 'student' });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6" />
                Student Management
            </h3>
            
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg">
                <div className="col-span-1 sm:col-span-2">
                    <label htmlFor="studentName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                    <input id="studentName" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                <div className="col-span-1 sm:col-span-2">
                    <label htmlFor="studentEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <input id="studentEmail" type="email" value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                <div>
                    <label htmlFor="studentDept" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                    <select id="studentDept" value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(Number(e.target.value))} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <button type="submit" className="w-full sm:w-auto justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform">Add Student</button>
            </form>

            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-11 pr-5 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 sm:text-sm"
                />
            </div>

            <div className="max-h-60 overflow-y-auto pr-2">
                {isLoading ? <SkeletonLoader /> : (
                    <ul className="space-y-2">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <li key={student.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700/50 border dark:border-slate-200 dark:border-slate-700 rounded-md transition-all duration-200 hover:shadow-md hover:scale-[1.02] animate-fadeInUp">
                                <div>
                                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{student.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handlePreviewSchedule(student)} title="Preview Schedule" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full">
                                        <EyeIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setAnalyzingStudent(student)} title="Analyze Workload" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-full">
                                        <ChartPieIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(student.id)} title="Delete Student" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </li>
                        )) : (
                           <div className="text-center py-8 animate-fadeInUp">
                               <UserGroupIcon className="w-10 h-10 mx-auto text-slate-400" />
                               <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No students found.</p>
                           </div>
                        )}
                    </ul>
                )}
            </div>

            <SchedulePreviewModal user={previewUser} onClose={() => setPreviewUser(null)} />
            <WorkloadAnalysisModal student={analyzingStudent} onClose={() => setAnalyzingStudent(null)} />
        </div>
    );
};

export default StudentManager;

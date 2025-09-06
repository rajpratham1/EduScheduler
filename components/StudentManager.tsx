// components/StudentManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentApi, getDepartments, deleteStudent } from '../services/api.ts';
import type { Student, Department, PreviewUser } from '../types.ts';
import { UserGroupIcon, TrashIcon, MagnifyingGlassIcon, EyeIcon, SparklesIcon } from './icons.tsx';
import { SkeletonLoader } from './SkeletonLoader.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import WorkloadAnalysisModal from './WorkloadAnalysisModal.tsx';
import SchedulePreviewModal from './SchedulePreviewModal.tsx';
import { useToast } from '../contexts/ToastContext.tsx';

const StudentManager: React.FC = () => {
    const [studentList, setStudentList] = useState<Student[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [newStudentMobile, setNewStudentMobile] = useState('');
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [studentToPreview, setStudentToPreview] = useState<PreviewUser | null>(null);
    const [studentToAnalyze, setStudentToAnalyze] = useState<Student | null>(null);
    const { addToast } = useToast();

    const loadData = useCallback(async () => {
        try {
            const [students, depts] = await Promise.all([
                studentApi.getAll(),
                getDepartments(),
            ]);
            setStudentList(students);
            setDepartments(depts);
            if (depts.length > 0 && !selectedDepartmentId) {
                setSelectedDepartmentId(depts[0].id);
            }
        } catch(err) {
            addToast("Failed to load student data.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [selectedDepartmentId, addToast]);

    useEffect(() => {
        setIsLoading(true);
        loadData();
    }, [loadData]);

    const filteredStudents = useMemo(() => {
        return studentList.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [studentList, searchTerm]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentName || !newStudentEmail || !newStudentMobile || !selectedDepartmentId) return;
        
        const optimisticData = { name: newStudentName, email: newStudentEmail, mobile_number: newStudentMobile, department_id: selectedDepartmentId };

        try {
            await studentApi.add(optimisticData);
            addToast("Student added! A user account will be created for them.", "success");
            setNewStudentName('');
            setNewStudentEmail('');
            setNewStudentMobile('');
            await loadData();
        } catch(err: any) {
            addToast(err.message || "Failed to add student.", "error");
        }
    };

    const handleDelete = (student: Student) => {
        setStudentToDelete(student);
    };

    const executeDelete = async () => {
        if (!studentToDelete) return;

        try {
            await deleteStudent(studentToDelete.id);
            addToast("Student deleted.", "success");
            await loadData();
        } catch(err: any) {
            addToast(err.message || "Failed to delete student.", "error");
        }
        setStudentToDelete(null);
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6" />
                Student Management
            </h3>
            
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                    <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <input type="email" value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Number</label>
                    <input type="tel" value={newStudentMobile} pattern="[0-9]{10}" title="Enter a 10-digit mobile number" onChange={e => setNewStudentMobile(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                    <select value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="sm:col-span-2">
                    <button type="submit" className="w-full sm:w-auto justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform">Add Student</button>
                </div>
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
                        <AnimatePresence>
                        {filteredStudents.length > 0 ? filteredStudents.map((student, i) => (
                            <motion.li key={student.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2, delay: i * 0.05 }} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700/50 border dark:border-slate-200 dark:border-slate-700 rounded-md">
                                <div>
                                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{student.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{departments.find(d => d.id === student.department_id)?.name || 'No Department'}</p>
                                </div>
                                <div>
                                    <button onClick={() => setStudentToAnalyze(student)} title="Analyze Workload" className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-full">
                                        <SparklesIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setStudentToPreview({id: student.id, name: student.name, role: 'student'})} title="Preview Schedule" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full">
                                        <EyeIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(student)} title="Delete Student" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.li>
                        )) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                                 <UserGroupIcon className="w-10 h-10 mx-auto text-slate-400" />
                                 <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No students found.</p>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </ul>
                )}
            </div>
             <ConfirmationModal 
                isOpen={!!studentToDelete}
                onClose={() => setStudentToDelete(null)}
                onConfirm={executeDelete}
                title="Delete Student"
                message={`Are you sure you want to delete ${studentToDelete?.name}? This will also delete their login account and enrollments.`}
            />
            <SchedulePreviewModal user={studentToPreview} onClose={() => setStudentToPreview(null)} />
            <WorkloadAnalysisModal student={studentToAnalyze} isOpen={!!studentToAnalyze} onClose={() => setStudentToAnalyze(null)} />
        </div>
    );
};

export default StudentManager;

// components/StudentManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentApi, signUp } from '../services/api.ts';
import * as api from '../services/api.ts';
import type { Student, Department, Subject, Enrollment, PreviewUser } from '../types.ts';
import { UserGroupIcon, TrashIcon, MagnifyingGlassIcon, EyeIcon, SparklesIcon } from './icons.tsx';
import { SkeletonLoader } from './SkeletonLoader.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import SchedulePreviewModal from './SchedulePreviewModal.tsx';
import WorkloadAnalysisModal from './WorkloadAnalysisModal.tsx';
import { useToast } from '../contexts/ToastContext.tsx';

const StudentManager: React.FC = () => {
    const [studentList, setStudentList] = useState<Student[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [studentToPreview, setStudentToPreview] = useState<PreviewUser | null>(null);
    const [studentToAnalyze, setStudentToAnalyze] = useState<Student | null>(null);
    const [managingEnrollment, setManagingEnrollment] = useState<Student | null>(null);
    const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<Set<number>>(new Set());
    const { addToast } = useToast();

    const loadData = useCallback(async () => {
        try {
            const [students, depts, subs] = await Promise.all([
                studentApi.getAll(),
                api.getDepartments(),
                api.getSubjects(),
            ]);
            setStudentList(students);
            setDepartments(depts);
            setSubjects(subs);
            if (depts.length > 0 && !selectedDepartmentId) {
                setSelectedDepartmentId(depts[0].id);
            }
        } catch(err) {
            addToast("Failed to load student data.", "error");
        }
        finally {
            setIsLoading(false);
        }
    }, [selectedDepartmentId, addToast]);

    useEffect(() => {
        setIsLoading(true);
        loadData();
    }, [loadData]);

    const handleOpenEnrollments = async (student: Student) => {
        setManagingEnrollment(student);
        const enrollments = await api.getStudentEnrollments(student.id);
        setEnrolledSubjectIds(new Set(enrollments.map(e => e.subject_id)));
    };

    const handleSaveEnrollments = async () => {
        if (!managingEnrollment) return;
        try {
            await api.updateStudentEnrollments(managingEnrollment.id, Array.from(enrolledSubjectIds));
            addToast("Enrollments updated!", "success");
            setManagingEnrollment(null);
        } catch (err) {
            addToast("Failed to update enrollments.", "error");
        }
    };
    
    const toggleEnrollment = (subjectId: number) => {
        setEnrolledSubjectIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subjectId)) {
                newSet.delete(subjectId);
            } else {
                newSet.add(subjectId);
            }
            return newSet;
        });
    };

    const filteredStudents = useMemo(() => {
        return studentList.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [studentList, searchTerm]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        // Similar to faculty, create user then student record
        const tempPassword = newStudentName.toLowerCase().replace(/\s/g, '') + '123';
        try {
             const newUser = await signUp({
                name: newStudentName,
                email: newStudentEmail,
                mobile_number: '0000000000',
                role: 'student',
                password: tempPassword,
            });
            const addedStudent = await studentApi.add({
                name: newStudentName,
                department_id: Number(selectedDepartmentId),
            });
             setStudentList(prev => [...prev, { ...addedStudent, id: newUser.id }]);
            addToast(`Student ${addedStudent.name} added! Temp password: ${tempPassword}`, "success");
            setNewStudentName('');
            setNewStudentEmail('');
        } catch(err: any) {
            addToast(err.message || "Failed to add student.", "error");
        }
    };

    const handleDelete = (student: Student) => setStudentToDelete(student);
    const executeDelete = async () => {
        if (!studentToDelete) return;
        await studentApi.delete(studentToDelete.id);
        addToast("Student deleted.", "success");
        setStudentList(prev => prev.filter(s => s.id !== studentToDelete.id));
        setStudentToDelete(null);
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><UserGroupIcon className="w-6 h-6" />Student Management</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg">
                 <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label><input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="mt-1 block w-full input" required /></div>
                 <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email (for login)</label><input type="email" value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} className="mt-1 block w-full input" required /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label><select value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(Number(e.target.value))} className="mt-1 block w-full input" required>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                <div className="self-end"><button type="submit" className="w-full justify-center btn-primary">Add Student</button></div>
            </form>
            <div className="relative"><MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-slate-400" /><input type="text" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-11 pr-5 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 sm:text-sm" /></div>
            <div className="max-h-60 overflow-y-auto pr-2">{isLoading ? <SkeletonLoader /> : <ul className="space-y-2"><AnimatePresence>{filteredStudents.map((student, i) => (
                <motion.li key={student.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2, delay: i * 0.05 }} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700/50 border dark:border-slate-200 dark:border-slate-700 rounded-md">
                    <div>
                        <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{student.name}</p>
                        <button onClick={() => handleOpenEnrollments(student)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Manage Enrollments</button>
                    </div>
                    <div>
                         <button onClick={() => setStudentToAnalyze(student)} className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-full" title="AI Workload Analysis"><SparklesIcon className="w-4 h-4" /></button>
                         <button onClick={() => setStudentToPreview({id: student.id, name: student.name, role: 'student'})} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-full" title="Preview Schedule"><EyeIcon className="w-4 h-4" /></button>
                         <button onClick={() => handleDelete(student)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-full" title="Delete Student"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                </motion.li>
            ))}</AnimatePresence></ul>}</div>
            <ConfirmationModal isOpen={!!studentToDelete} onClose={() => setStudentToDelete(null)} onConfirm={executeDelete} title="Delete Student" message={`Are you sure you want to delete ${studentToDelete?.name}?`} />
            <SchedulePreviewModal user={studentToPreview} onClose={() => setStudentToPreview(null)} />
            <WorkloadAnalysisModal student={studentToAnalyze} isOpen={!!studentToAnalyze} onClose={() => setStudentToAnalyze(null)} />

            {/* Enrollment Modal */}
            {managingEnrollment && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setManagingEnrollment(null)}>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg p-6 font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-700">Enrollments for {managingEnrollment.name}</h3>
                    <div className="p-6 max-h-80 overflow-y-auto space-y-2">{subjects.map(subject => (
                        <label key={subject.id} className="flex items-center p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                            <input type="checkbox" checked={enrolledSubjectIds.has(subject.id)} onChange={() => toggleEnrollment(subject.id)} className="form-checkbox" />
                            <span className="ml-3 text-sm text-slate-700 dark:text-slate-200">{subject.name}</span>
                        </label>
                    ))}</div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3"><button onClick={() => setManagingEnrollment(null)} className="btn-secondary">Cancel</button><button onClick={handleSaveEnrollments} className="btn-primary">Save</button></div>
                </div>
            </div>}
        </div>
    );
};

export default StudentManager;

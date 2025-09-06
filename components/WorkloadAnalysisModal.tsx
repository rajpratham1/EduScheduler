// components/WorkloadAnalysisModal.tsx
import React, { useState, useEffect } from 'react';
import * as api from '../services/api.ts';
import * as geminiService from '../services/geminiService.ts';
import type { Student, HydratedClassSchedule } from '../types.ts';
import { hydrateSchedule } from '../utils/scheduleUtils.ts';

interface WorkloadAnalysisModalProps {
    student: Student | null;
    isOpen: boolean;
    onClose: () => void;
}

const WorkloadAnalysisModal: React.FC<WorkloadAnalysisModalProps> = ({ student, isOpen, onClose }) => {
    const [schedule, setSchedule] = useState<HydratedClassSchedule[]>([]);
    const [analysis, setAnalysis] = useState<string>('');
    const [days, setDays] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (student && isOpen) {
            const fetchAndAnalyze = async () => {
                setIsLoading(true);
                setAnalysis('');
                try {
                    const [
                        publishedSchedule,
                        enrollments,
                        subjects,
                        faculty,
                        classrooms,
                        daysOfWeek,
                    ] = await Promise.all([
                        api.getLatestSchedule(),
                        api.getStudentEnrollments(student.id),
                        api.getSubjects(),
                        api.getFaculty(),
                        api.getClassrooms(),
                        api.getDaysOfWeek(),
                    ]);
                    
                    setDays(daysOfWeek);

                    // FIX: The `enrollments` array is an array of strings (subject IDs), not objects.
                    const enrolledSubjectIds = new Set(enrollments);
                    const studentScheduleData = publishedSchedule.filter(s => enrolledSubjectIds.has(s.subject_id));
                    const hydrated = hydrateSchedule(studentScheduleData, subjects, faculty, classrooms);
                    setSchedule(hydrated);

                    if (hydrated.length > 0) {
                        const aiAnalysis = await geminiService.analyzeStudentWorkload(student, hydrated);
                        setAnalysis(aiAnalysis);
                    } else {
                        setAnalysis("This student has no classes in the published schedule, so no workload analysis is possible.");
                    }

                } catch (error) {
                    setAnalysis("An error occurred while analyzing the workload.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAndAnalyze();
        }
    }, [student, isOpen]);

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl animate-fadeInUp" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI Workload Analysis for {student.name}</h3>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Student's Schedule</h4>
                        <div className="border dark:border-slate-700 rounded-lg p-2 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
                        {schedule.length > 0 ? (
                           days.map(day => {
                                const dayClasses = schedule.filter(s => s.day === day).sort((a,b) => parseInt(a.time.split('-')[0]) - parseInt(b.time.split('-')[0]));
                                if (dayClasses.length === 0) return null;
                                return (
                                    <div key={day}>
                                        <p className="font-medium text-xs text-slate-600 dark:text-slate-400">{day}</p>
                                        <div className="pl-2 border-l-2 border-slate-200 dark:border-slate-600 mt-1 space-y-1">
                                            {dayClasses.map(c => (
                                                <div key={c.instance_id} className="text-xs">
                                                    <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">{c.time}:</span> {c.subject}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                           })
                        ) : <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No scheduled classes.</p> }
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Advisor's Analysis</h4>
                        <div className="border dark:border-slate-700 rounded-lg p-3 bg-indigo-50/50 dark:bg-indigo-900/30 text-sm text-indigo-900 dark:text-indigo-200 prose prose-sm h-full">
                            {isLoading ? (
                                <p>Analyzing schedule...</p>
                            ) : (
                                <p style={{whiteSpace: 'pre-wrap'}}>{analysis}</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkloadAnalysisModal;

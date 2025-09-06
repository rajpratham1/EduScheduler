// components/StudentDashboard.tsx
import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import * as geminiService from '../services/geminiService';
import type { User, HydratedClassSchedule, Student } from '../types';
import { hydrateSchedule } from '../utils/scheduleUtils';
import { getIcs } from '../utils/calendar';
import { BookOpenIcon, UserCircleIcon, BuildingOfficeIcon, CalendarIcon, SparklesIcon } from './icons';

interface StudentDashboardProps {
    user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
    const [schedule, setSchedule] = useState<HydratedClassSchedule[]>([]);
    const [days, setDays] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [analysis, setAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [
                    publishedSchedule,
                    enrollments,
                    subjects,
                    faculty,
                    classrooms,
                    daysOfWeek,
                    timeSlotsData,
                ] = await Promise.all([
                    api.getLatestSchedule(),
                    api.getStudentEnrollments(user.id),
                    api.getSubjects(),
                    api.getFaculty(),
                    api.getClassrooms(),
                    api.getDaysOfWeek(),
                    api.getTimeSlots(),
                ]);

                const enrolledSubjectIds = new Set(enrollments.map(e => e.subject_id));
                const studentScheduleData = publishedSchedule.filter(s => enrolledSubjectIds.has(s.subject_id));
                const hydrated = hydrateSchedule(studentScheduleData, subjects, faculty, classrooms);

                setSchedule(hydrated);
                setDays(daysOfWeek);
                setTimeSlots(timeSlotsData);
            } catch (error) {
                console.error("Failed to load student dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user.id]);
    
    const handleAnalyzeWorkload = async () => {
        setIsAnalyzing(true);
        try {
            // The API needs a Student object, but we have a User object. We can mock the missing fields.
            const student: Student = { ...user, department_id: 1 }; // department_id is not critical for this AI prompt
            const aiAnalysis = await geminiService.analyzeStudentWorkload(student, schedule);
            setAnalysis(aiAnalysis);
        } catch (error) {
            setAnalysis("Could not analyze workload due to an error.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDownloadIcs = (classInfo: HydratedClassSchedule) => {
        const icsData = getIcs(classInfo, days);
        const blob = new Blob([decodeURIComponent(icsData.substring(icsData.indexOf(',') + 1))], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${classInfo.subject.replace(/\s/g, '_')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <p className="text-center p-8">Loading your schedule...</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Class Schedule</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Here are your classes for the week.</p>
                </div>
                <button onClick={handleAnalyzeWorkload} disabled={isAnalyzing || schedule.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm disabled:bg-indigo-400 flex items-center justify-center gap-2">
                    <SparklesIcon className="w-4 h-4" />
                    {isAnalyzing ? 'Analyzing...' : 'Analyze My Workload'}
                </button>
            </div>

            {analysis && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/50 rounded-lg animate-fadeInUp">
                    <h3 className="font-semibold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5" /> AI Workload Analysis
                    </h3>
                    <p className="mt-2 text-sm text-indigo-700 dark:text-indigo-300" style={{whiteSpace: 'pre-wrap'}}>{analysis}</p>
                </div>
            )}

            {schedule.length > 0 ? (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border dark:border-slate-700">
                    <div className="grid gap-px" style={{ gridTemplateColumns: `minmax(100px, 0.5fr) repeat(${days.length}, minmax(150px, 1fr))` }}>
                         <div className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-tl-lg">Time</div>
                        {days.map(day => <div key={day} className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">{day}</div>)}
                        {timeSlots.map(time => (
                            <React.Fragment key={time}>
                                <div className="sticky left-0 bg-slate-50 dark:bg-slate-700/50 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 self-stretch flex items-center justify-center">{time}</div>
                                {days.map(day => {
                                    const classItem = schedule.find(c => c.day === day && c.time === time);
                                    return (
                                        <div key={`${day}-${time}`} className="p-2 border-t border-slate-100 dark:border-slate-700 min-h-[100px]">
                                            {classItem && (
                                                <div className="p-2.5 rounded-md bg-green-50 dark:bg-green-900/40 text-xs h-full flex flex-col justify-between">
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><BookOpenIcon className="w-3 h-3" />{classItem.subject}</p>
                                                        <p className="text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5"><UserCircleIcon className="w-3 h-3" />{classItem.faculty}</p>
                                                        <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><BuildingOfficeIcon className="w-3 h-3" />{classItem.classroom}</p>
                                                    </div>
                                                    <button onClick={() => handleDownloadIcs(classItem)} className="text-green-600 dark:text-green-400 hover:underline text-[11px] mt-2 flex items-center gap-1 self-start">
                                                        <CalendarIcon className="w-3 h-3" /> Add to Calendar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400">You are not enrolled in any classes in the published schedule.</p>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;

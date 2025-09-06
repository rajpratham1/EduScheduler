// components/StudentDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
// FIX: Added file extensions to imports
import type { User, HydratedClassSchedule } from '../types.ts';
import * as api from '../services/api.ts';
import { hydrateSchedule } from '../utils/scheduleUtils.ts';
import { getIcs } from '../utils/calendar.ts';
import { CalendarIcon, UserCircleIcon, BuildingOfficeIcon, BookOpenIcon } from './icons.tsx';

interface StudentDashboardProps {
    user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
    const [schedule, setSchedule] = useState<HydratedClassSchedule[]>([]);
    const [days, setDays] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                publishedSchedule,
                subjects,
                faculty,
                classrooms,
                enrollments,
                daysOfWeek,
                timeSlotsData
            ] = await Promise.all([
                api.getLatestSchedule(),
                api.getSubjects(),
                api.getFaculty(),
                api.getClassrooms(),
                api.getStudentEnrollments(user.id),
                api.getDaysOfWeek(),
                api.getTimeSlots()
            ]);

            const enrolledSubjectIds = new Set(enrollments.map(e => e.subject_id));
            const studentScheduleData = publishedSchedule.filter(s => enrolledSubjectIds.has(s.subject_id));
            const hydrated = hydrateSchedule(studentScheduleData, subjects, faculty, classrooms);

            setSchedule(hydrated);
            setDays(daysOfWeek);
            setTimeSlots(timeSlotsData);
        } catch (error) {
            console.error("Failed to load student schedule", error);
        } finally {
            setIsLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDownloadICS = (classInfo: HydratedClassSchedule) => {
        const icsData = getIcs(classInfo, days);
        const blob = new Blob([decodeURIComponent(icsData.substring(icsData.indexOf(',')))], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${classInfo.subject}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <div className="p-4">Loading your schedule...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Weekly Schedule</h2>
            {schedule.length > 0 ? (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border dark:border-slate-700">
                    <div className="grid gap-px" style={{ gridTemplateColumns: `minmax(100px, 0.5fr) repeat(${days.length}, minmax(150px, 1fr))` }}>
                        {/* Header */}
                        <div className="sticky top-0 left-0 bg-slate-50 dark:bg-slate-900 z-20 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-tl-lg">Time</div>
                        {days.map(day => (
                            <div key={day} className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">{day}</div>
                        ))}
                        
                        {/* Body */}
                        {timeSlots.map((time) => (
                            <React.Fragment key={time}>
                                <div className="sticky left-0 bg-slate-50 dark:bg-slate-700/50 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 self-stretch flex items-center justify-center">{time}</div>
                                {days.map(day => {
                                    const classItem = schedule.find(c => c.day === day && c.time === time);
                                    return (
                                        <div key={`${day}-${time}`} className="p-2 border-t border-slate-100 dark:border-slate-700 min-h-[100px]">
                                            {classItem && (
                                                <div className="p-2.5 rounded-md shadow-sm border text-xs bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                                                    <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><BookOpenIcon className="w-3 h-3" />{classItem.subject}</p>
                                                    <p className="text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5"><UserCircleIcon className="w-3 h-3" />{classItem.faculty}</p>
                                                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><BuildingOfficeIcon className="w-3 h-3" />{classItem.classroom}</p>
                                                    <button onClick={() => handleDownloadICS(classItem)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] mt-2 flex items-center gap-1">
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
                    <p className="text-slate-500 dark:text-slate-400">You are not enrolled in any classes for the current schedule.</p>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;

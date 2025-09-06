// components/FacultyDashboard.tsx
import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import type { User, HydratedClassSchedule } from '../types';
import { hydrateSchedule } from '../utils/scheduleUtils';
import { getIcs } from '../utils/calendar';
import { BookOpenIcon, BuildingOfficeIcon, CalendarIcon } from './icons';

interface FacultyDashboardProps {
    user: User;
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ user }) => {
    const [schedule, setSchedule] = useState<HydratedClassSchedule[]>([]);
    const [days, setDays] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [
                    publishedSchedule,
                    subjects,
                    faculty,
                    classrooms,
                    daysOfWeek,
                    timeSlotsData,
                ] = await Promise.all([
                    api.getLatestSchedule(),
                    api.getSubjects(),
                    api.getFaculty(),
                    api.getClassrooms(),
                    api.getDaysOfWeek(),
                    api.getTimeSlots(),
                ]);

                const facultySchedule = publishedSchedule.filter(s => s.faculty_id === user.id);
                const hydrated = hydrateSchedule(facultySchedule, subjects, faculty, classrooms);
                setSchedule(hydrated);
                setDays(daysOfWeek);
                setTimeSlots(timeSlotsData);
            } catch (error) {
                console.error("Failed to load faculty dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user.id]);

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
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Teaching Schedule</h1>
            {schedule.length > 0 ? (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border dark:border-slate-700">
                    <div className="grid gap-px" style={{ gridTemplateColumns: `minmax(100px, 0.5fr) repeat(${days.length}, minmax(150px, 1fr))` }}>
                        {/* Header */}
                        <div className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-tl-lg">Time</div>
                        {days.map(day => <div key={day} className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">{day}</div>)}
                        {/* Body */}
                        {timeSlots.map(time => (
                            <React.Fragment key={time}>
                                <div className="sticky left-0 bg-slate-50 dark:bg-slate-700/50 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 self-stretch flex items-center justify-center">{time}</div>
                                {days.map(day => {
                                    const classItem = schedule.find(c => c.day === day && c.time === time);
                                    return (
                                        <div key={`${day}-${time}`} className="p-2 border-t border-slate-100 dark:border-slate-700 min-h-[100px]">
                                            {classItem && (
                                                <div className="p-2.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-xs h-full flex flex-col justify-between">
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><BookOpenIcon className="w-3 h-3" />{classItem.subject}</p>
                                                        <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><BuildingOfficeIcon className="w-3 h-3" />{classItem.classroom}</p>
                                                    </div>
                                                    <button onClick={() => handleDownloadIcs(classItem)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] mt-2 flex items-center gap-1 self-start">
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
                    <p className="text-slate-500 dark:text-slate-400">You have no classes assigned in the published schedule.</p>
                </div>
            )}
        </div>
    );
};

export default FacultyDashboard;

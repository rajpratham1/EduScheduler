// components/StudentDashboard.tsx
import React, { useState, useEffect } from 'react';
import * as api from '../services/api.ts';
import type { User, HydratedClassSchedule } from '../types.ts';
import { hydrateSchedule } from '../utils/scheduleUtils.ts';
import { getIcs } from '../utils/calendar.ts';
import { BookOpenIcon, UserCircleIcon, BuildingOfficeIcon, CalendarIcon } from './icons.tsx';

interface StudentDashboardProps {
    user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
    const [schedule, setSchedule] = useState<HydratedClassSchedule[]>([]);
    const [days, setDays] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSchedule = async () => {
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
        };
        loadSchedule();
    }, [user.id]);
    
    if (isLoading) {
        return <div className="text-center p-8">Loading your schedule...</div>;
    }

    return (
        <div className="space-y-6">
             <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Class Schedule</h1>
             {schedule.length > 0 ? (
                 <div className="overflow-x-auto bg-white dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700">
                    <div className="grid gap-px" style={{ gridTemplateColumns: `minmax(80px, 0.5fr) repeat(${days.length}, minmax(150px, 1fr))` }}>
                        <div className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 p-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Time</div>
                        {days.map(day => <div key={day} className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 p-2 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">{day}</div>)}
                        
                        {timeSlots.map(time => (
                            <React.Fragment key={time}>
                                <div className="sticky left-0 bg-slate-50 dark:bg-slate-700/50 p-2 text-xs font-semibold text-slate-600 dark:text-slate-300 self-stretch flex items-center justify-center">{time}</div>
                                {days.map(day => {
                                    const classItem = schedule.find(c => c.day === day && c.time === time);
                                    return (
                                        <div key={`${day}-${time}`} className="p-2 border-t border-slate-100 dark:border-slate-700 min-h-[80px]">
                                            {classItem && (
                                                <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md text-xs group relative">
                                                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><BookOpenIcon className="w-3.5 h-3.5" />{classItem.subject}</p>
                                                    <p className="text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5"><UserCircleIcon className="w-3.5 h-3.5" />{classItem.faculty}</p>
                                                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><BuildingOfficeIcon className="w-3.5 h-3.5" />{classItem.classroom}</p>
                                                    <a
                                                        href={getIcs(classItem, days)}
                                                        download={`${classItem.subject}.ics`}
                                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-full"
                                                        title="Add to Calendar"
                                                    >
                                                        <CalendarIcon className="w-4 h-4" />
                                                    </a>
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
                    <p className="text-slate-500 dark:text-slate-400">You have no classes in the published schedule.</p>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;

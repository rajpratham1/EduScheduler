// components/SchedulePreviewModal.tsx
import React, { useState, useEffect } from 'react';
import * as api from '../services/api.ts';
import type { PreviewUser, HydratedClassSchedule } from '../types.ts';
import { hydrateSchedule } from '../utils/scheduleUtils.ts';
import { BookOpenIcon, UserCircleIcon, BuildingOfficeIcon } from './icons.tsx';

interface SchedulePreviewModalProps {
    user: PreviewUser | null;
    onClose: () => void;
}

const SchedulePreviewModal: React.FC<SchedulePreviewModalProps> = ({ user, onClose }) => {
    const [schedule, setSchedule] = useState<HydratedClassSchedule[]>([]);
    const [days, setDays] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
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
                        user.role === 'student' ? api.getStudentEnrollments(user.id) : Promise.resolve([]),
                        api.getDaysOfWeek(),
                        api.getTimeSlots()
                    ]);
                    
                    let userScheduleData;
                    if (user.role === 'faculty') {
                        userScheduleData = publishedSchedule.filter(s => s.faculty_id === user.id);
                    } else { // student
                        // FIX: enrollments is a string array of subject IDs, not objects.
                        const enrolledSubjectIds = new Set(enrollments);
                        userScheduleData = publishedSchedule.filter(s => enrolledSubjectIds.has(s.subject_id));
                    }

                    const hydrated = hydrateSchedule(userScheduleData, subjects, faculty, classrooms);
                    setSchedule(hydrated);
                    setDays(daysOfWeek);
                    setTimeSlots(timeSlotsData);
                } finally {
                    setIsLoading(false);
                }
            };
            loadSchedule();
        }
    }, [user]);

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl animate-fadeInUp" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Schedule Preview for {user.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{user.role}'s View</p>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {isLoading ? <p>Loading schedule...</p> : (
                        schedule.length > 0 ? (
                            <div className="overflow-x-auto">
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
                                                            <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md text-[11px]">
                                                                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><BookOpenIcon className="w-3 h-3" />{classItem.subject}</p>
                                                                <p className="text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5"><UserCircleIcon className="w-3 h-3" />{classItem.faculty}</p>
                                                                <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><BuildingOfficeIcon className="w-3 h-3" />{classItem.classroom}</p>
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
                            <p className="text-center py-8 text-slate-500 dark:text-slate-400">This user has no classes in the published schedule.</p>
                        )
                    )}
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

export default SchedulePreviewModal;
// components/StudentDashboard.tsx
import React, { useState, useEffect } from 'react';
import * as api from '../services/api.ts';
import type { User, HydratedClassSchedule } from '../types.ts';
import { hydrateSchedule } from '../utils/scheduleUtils.ts';
import { BookOpenIcon, UserCircleIcon, BuildingOfficeIcon, CalendarIcon } from './icons.tsx';
import { getIcs } from '../utils/calendar.ts';

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
                
                const enrolledSubjectIds = new Set(enrollments);
                const studentScheduleData = publishedSchedule.filter(s => enrolledSubjectIds.has(s.subject_id));

                const hydrated = hydrateSchedule(studentScheduleData, subjects, faculty, classrooms);
                setSchedule(hydrated);
                setDays(daysOfWeek);
                setTimeSlots(timeSlotsData);
            } catch (error) {
                console.error("Failed to load student schedule:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSchedule();
    }, [user.id]);

    const ClassCard: React.FC<{ classInfo: HydratedClassSchedule }> = ({ classInfo }) => {
        const handleDownloadIcs = () => {
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

        return (
            <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-sm h-full flex flex-col justify-between group">
                <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><BookOpenIcon className="w-4 h-4 flex-shrink-0" />{classInfo.subject}</p>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5"><UserCircleIcon className="w-4 h-4 flex-shrink-0" />{classInfo.faculty}</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><BuildingOfficeIcon className="w-4 h-4 flex-shrink-0" />{classInfo.classroom}</p>
                </div>
                 <div className="mt-2 text-right">
                    <button
                        onClick={handleDownloadIcs}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                        title="Add to Calendar"
                    >
                        <CalendarIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <div>Loading your schedule...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Weekly Schedule</h2>
             {schedule.length > 0 ? (
                <div className="overflow-x-auto bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border dark:border-slate-700">
                     <div className="grid gap-px bg-slate-200 dark:bg-slate-700" style={{ gridTemplateColumns: `minmax(80px, 0.5fr) repeat(${days.length}, minmax(160px, 1fr))` }}>
                        {/* Headers */}
                        <div className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10 p-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Time</div>
                        {days.map(day => (
                            <div key={day} className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10 p-2 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">{day}</div>
                        ))}
                        {/* Grid Content */}
                        {timeSlots.map(time => (
                            <React.Fragment key={time}>
                                <div className="sticky left-0 bg-slate-100 dark:bg-slate-800/80 backdrop-blur-sm p-2 text-xs font-semibold text-slate-600 dark:text-slate-300 self-stretch flex items-center justify-center">{time}</div>
                                {days.map(day => (
                                    <div key={`${day}-${time}`} className="p-2 min-h-[100px] bg-slate-50 dark:bg-slate-900">
                                       {schedule.filter(c => c.day === day && c.time === time).map((classItem) => (
                                            <ClassCard key={classItem.instance_id} classInfo={classItem} />
                                       ))}
                                    </div>
                                ))}
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

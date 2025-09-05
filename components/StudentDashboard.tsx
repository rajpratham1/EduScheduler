// components/StudentDashboard.tsx
import React, { useState, useEffect } from 'react';
import { TimetableGrid } from './TimetableGrid';
import { SkeletonLoader } from './SkeletonLoader';
import * as api from '../services/api';
import type { User, HydratedClassSchedule, Enrollment } from '../types';
import { hydrateSchedule, getUniqueTimeSlots } from '../utils/scheduleUtils';

interface StudentDashboardProps {
    user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
    const [schedule, setSchedule] = useState<HydratedClassSchedule[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSchedule = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const studentUser = (await api.getStudents()).find(s => s.email === user.email);
                if (!studentUser) {
                    throw new Error("Could not find student profile for the current user.");
                }

                const [
                    publishedSchedule,
                    enrollments,
                    subjects,
                    faculty,
                    classrooms
                ] = await Promise.all([
                    api.getLatestSchedule(),
                    api.getStudentEnrollments(studentUser.id),
                    api.getSubjects(),
                    api.getFaculty(),
                    api.getClassrooms()
                ]);

                const enrolledSubjectIds = new Set(enrollments.map((e: Enrollment) => e.subject_id));
                const studentScheduleData = publishedSchedule.filter(s => enrolledSubjectIds.has(s.subject_id));
                
                const hydrated = hydrateSchedule(studentScheduleData, subjects, faculty, classrooms);
                setSchedule(hydrated);
                setTimeSlots(getUniqueTimeSlots(publishedSchedule));

            } catch (err) {
                setError("Failed to load your schedule. Please try again later.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadSchedule();
    }, [user.email]);

    return (
        <div className="space-y-6">
             <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Class Schedule</h2>
                <p className="mt-1 text-slate-600 dark:text-slate-400">This is the official published timetable for your enrolled subjects.</p>
            </div>
            
            {isLoading && <SkeletonLoader />}
            {error && <p className="text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">{error}</p>}
            
            {!isLoading && !error && schedule.length > 0 && (
                <TimetableGrid
                    schedule={schedule}
                    timeSlots={timeSlots}
                    isEditable={false}
                />
            )}

            {!isLoading && !error && schedule.length === 0 && (
                 <div className="text-center py-12 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-slate-600 dark:text-slate-400">You are not enrolled in any classes or there is no published schedule.</p>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
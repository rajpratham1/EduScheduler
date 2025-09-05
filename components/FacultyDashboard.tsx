// components/FacultyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { TimetableGrid } from './TimetableGrid';
import { SkeletonLoader } from './SkeletonLoader';
import * as api from '../services/api';
import type { User, HydratedClassSchedule, Faculty } from '../types';
import { hydrateSchedule, getUniqueTimeSlots } from '../utils/scheduleUtils';

interface FacultyDashboardProps {
    user: User;
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ user }) => {
    const [schedule, setSchedule] = useState<HydratedClassSchedule[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [facultyUser, setFacultyUser] = useState<Faculty | null>(null);

    useEffect(() => {
        const loadSchedule = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const [
                    publishedSchedule,
                    subjects,
                    allFaculty,
                    classrooms
                ] = await Promise.all([
                    api.getLatestSchedule(),
                    api.getSubjects(),
                    api.getFaculty(),
                    api.getClassrooms()
                ]);

                const currentFaculty = allFaculty.find(f => f.email === user.email);
                if (!currentFaculty) {
                    throw new Error("Could not find faculty profile for the current user.");
                }
                setFacultyUser(currentFaculty);
                
                const hydrated = hydrateSchedule(publishedSchedule, subjects, allFaculty, classrooms);
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
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Weekly Schedule</h2>
                <p className="mt-1 text-slate-600 dark:text-slate-400">This is the official published timetable. Your classes are highlighted.</p>
            </div>
            
            {isLoading && <SkeletonLoader />}
            {error && <p className="text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">{error}</p>}
            
            {!isLoading && !error && schedule.length > 0 && facultyUser && (
                <TimetableGrid
                    schedule={schedule}
                    timeSlots={timeSlots}
                    isEditable={false}
                    highlightFacultyId={facultyUser.id}
                />
            )}

            {!isLoading && !error && schedule.length === 0 && (
                <div className="text-center py-12 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-slate-600 dark:text-slate-400">There is currently no published schedule for this week.</p>
                </div>
            )}
        </div>
    );
};

export default FacultyDashboard;
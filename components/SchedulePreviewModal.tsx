// components/SchedulePreviewModal.tsx
import React, { useState, useEffect } from 'react';
import type { HydratedClassSchedule, PreviewUser } from '../types';
import { TimetableGrid } from './TimetableGrid';
import * as api from '../services/api';
import { hydrateSchedule, getUniqueTimeSlots } from '../utils/scheduleUtils';
import { SkeletonLoader } from './SkeletonLoader';

interface SchedulePreviewModalProps {
    user: PreviewUser | null;
    onClose: () => void;
}

const SchedulePreviewModal: React.FC<SchedulePreviewModalProps> = ({ user, onClose }) => {
    const [schedule, setSchedule] = useState<HydratedClassSchedule[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            const loadPreview = async () => {
                setIsLoading(true);
                setError(null);
                try {
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
                    
                    let finalScheduleData = publishedSchedule;

                    if (user.role === 'student') {
                        const enrollments = await api.getStudentEnrollments(user.id);
                        const enrolledSubjectIds = new Set(enrollments.map(e => e.subject_id));
                        finalScheduleData = publishedSchedule.filter(s => enrolledSubjectIds.has(s.subject_id));
                    }

                    setSchedule(hydrateSchedule(finalScheduleData, subjects, allFaculty, classrooms));
                    setTimeSlots(getUniqueTimeSlots(publishedSchedule));

                } catch (e) {
                    setError("Could not load the schedule for this user.");
                } finally {
                    setIsLoading(false);
                }
            };
            loadPreview();
        }
    }, [user]);


    if (!user) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-6xl animate-fadeInUp" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Schedule Preview for {user.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">This is the official schedule this user will see when they log in.</p>
                </div>
                <div className="p-2 sm:p-6 max-h-[70vh] overflow-y-auto">
                    {isLoading && <SkeletonLoader />}
                    {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
                    {!isLoading && !error && (
                        <TimetableGrid 
                            schedule={schedule} 
                            timeSlots={timeSlots} 
                            isEditable={false} 
                            highlightFacultyId={user.role === 'faculty' ? user.id : undefined}
                        />
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

// components/ScheduleSettingsManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api.ts';
import { CalendarDaysIcon, TrashIcon } from './icons.tsx';
import { SkeletonLoader } from './SkeletonLoader.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import { useToast } from '../contexts/ToastContext.tsx';

const ScheduleSettingsManager: React.FC = () => {
    const [days, setDays] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newDay, setNewDay] = useState('');
    const [newTime, setNewTime] = useState('');
    const [dayToDelete, setDayToDelete] = useState<string | null>(null);
    const [timeToDelete, setTimeToDelete] = useState<string | null>(null);
    const { addToast } = useToast();

    const loadData = useCallback(async () => {
        try {
            const [fetchedDays, fetchedTimes] = await Promise.all([
                api.getDaysOfWeek(),
                api.getTimeSlots(),
            ]);
            setDays(fetchedDays);
            setTimeSlots(fetchedTimes);
        } catch(err) {
            addToast("Failed to load schedule settings.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        setIsLoading(true);
        loadData();
    }, [loadData]);

    const handleAddDay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDay) return;
        try {
            await api.addDayOfWeek(newDay);
            setNewDay('');
            addToast("Day added!", "success");
            await loadData();
        } catch(err: any) {
            addToast(err.message || "Failed to add day.", "error");
        }
    };

    const executeRemoveDay = async () => {
        if (!dayToDelete) return;
        try {
            await api.removeDayOfWeek(dayToDelete);
            addToast("Day removed.", "success");
            await loadData();
        } catch(err: any) {
            addToast(err.message || "Failed to remove day.", "error");
        }
        setDayToDelete(null);
    };

    const handleAddTime = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{1,2}-\d{1,2}$/.test(newTime)) {
            addToast("Invalid time format. Please use a format like '9-10'.", "error");
            return;
        }
        try {
            await api.addTimeSlot(newTime);
            setNewTime('');
            addToast("Time slot added!", "success");
            await loadData();
        } catch(err: any) {
            addToast(err.message || "Failed to add time slot.", "error");
        }
    };

    const executeRemoveTime = async () => {
        if (!timeToDelete) return;
        try {
            await api.removeTimeSlot(timeToDelete);
            addToast("Time slot removed.", "success");
            await loadData();
        } catch(err: any) {
            addToast(err.message || "Failed to remove time slot.", "error");
        }
        setTimeToDelete(null);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CalendarDaysIcon className="w-6 h-6" />
                Schedule Settings
            </h3>
            
            {/* Days Management */}
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Working Days</h4>
                <form onSubmit={handleAddDay} className="flex gap-2">
                    <input value={newDay} placeholder="e.g., Saturday" onChange={e => setNewDay(e.target.value)} className="block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                    <button type="submit" className="px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform">Add</button>
                </form>
                 {isLoading ? <SkeletonLoader /> : (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {days.map(day => (
                            <div key={day} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200 text-xs font-medium px-2.5 py-1 rounded-full">
                                {day}
                                <button onClick={() => setDayToDelete(day)} className="ml-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-100"><TrashIcon className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Time Slots Management */}
             <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Time Slots</h4>
                <form onSubmit={handleAddTime} className="flex gap-2">
                    <input value={newTime} placeholder="e.g., 4-5" onChange={e => setNewTime(e.target.value)} className="block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm text-sm dark:text-slate-200" required />
                    <button type="submit" className="px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform">Add</button>
                </form>
                 {isLoading ? <SkeletonLoader /> : (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {timeSlots.map(time => (
                            <div key={time} className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full">
                                {time}
                                <button onClick={() => setTimeToDelete(time)} className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100"><TrashIcon className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
             <ConfirmationModal 
                isOpen={!!dayToDelete}
                onClose={() => setDayToDelete(null)}
                onConfirm={executeRemoveDay}
                title="Remove Day"
                message={`Are you sure you want to remove ${dayToDelete}? This could affect existing schedules.`}
            />
             <ConfirmationModal 
                isOpen={!!timeToDelete}
                onClose={() => setTimeToDelete(null)}
                onConfirm={executeRemoveTime}
                title="Remove Time Slot"
                message={`Are you sure you want to remove the time slot ${timeToDelete}?`}
            />
        </div>
    );
};

export default ScheduleSettingsManager;
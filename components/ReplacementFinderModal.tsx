// components/ReplacementFinderModal.tsx
import React, { useState, useEffect } from 'react';
import * as api from '../services/api.ts';
import type { Faculty, HydratedClassSchedule } from '../types.ts';

interface ReplacementFinderModalProps {
    classInfo: HydratedClassSchedule | null;
    onClose: () => void;
    // FIX: Changed newFacultyId type from number to string to match Faculty ID type.
    onSelect: (newFacultyId: string) => void;
}

const ReplacementFinderModal: React.FC<ReplacementFinderModalProps> = ({ classInfo, onClose, onSelect }) => {
    const [availableFaculty, setAvailableFaculty] = useState<Faculty[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (classInfo) {
            const fetchAvailableFaculty = async () => {
                setIsLoading(true);
                setError('');
                try {
                    const faculty = await api.getAvailableFaculty(classInfo.subject_id, classInfo.day, classInfo.time);
                    setAvailableFaculty(faculty);
                } catch (err) {
                    setError('Failed to fetch available faculty.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAvailableFaculty();
        }
    }, [classInfo]);

    if (!classInfo) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md animate-fadeInUp">
                <div className="p-6 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Find Replacement Faculty</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        For {classInfo.subject} on {classInfo.day} at {classInfo.time}.
                    </p>
                </div>
                <div className="p-6 max-h-80 overflow-y-auto">
                    {isLoading && <p className="text-slate-500 dark:text-slate-400">Loading suggestions...</p>}
                    {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
                    {!isLoading && !error && (
                        <ul className="space-y-2">
                            {availableFaculty.length > 0 ? (
                                availableFaculty.map(faculty => (
                                    <li key={faculty.id}>
                                        <button
                                            onClick={() => onSelect(faculty.id)}
                                            className="w-full text-left p-3 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors flex justify-between items-center"
                                        >
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{faculty.name}</span>
                                            <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-full">Select</span>
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-4">No available faculty found for this slot.</p>
                            )}
                        </ul>
                    )}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReplacementFinderModal;

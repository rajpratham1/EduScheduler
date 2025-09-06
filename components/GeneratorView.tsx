// components/GeneratorView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api.ts';
import * as geminiService from '../services/geminiService.ts';
import { hydrateSchedule, dehydrateSchedule } from '../utils/scheduleUtils.ts';
import { detectConflicts } from '../utils/conflictDetector.ts';
import TimetableGrid from './TimetableGrid.tsx';
import { Loader } from './Loader.tsx';
import ConflictReport from './ConflictReport.tsx';
import ReplacementFinderModal from './ReplacementFinderModal.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import type { Subject, Faculty, Classroom, HydratedClassSchedule, Conflict } from '../types.ts';
import type { DropResult } from '../libs/react-beautiful-dnd.ts';

const GeneratorView: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [days, setDays] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [hydratedSchedule, setHydratedSchedule] = useState<HydratedClassSchedule[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [constraints, setConstraints] = useState('- Dr. Marie Curie is unavailable on Fridays.\n- Quantum Physics must be in a Lab.');
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [classToReplace, setClassToReplace] = useState<HydratedClassSchedule | null>(null);
    const [isConfirmingPublish, setIsConfirmingPublish] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useToast();

    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                subjectsData, 
                facultyData, 
                classroomsData,
                daysData,
                timeSlotsData,
                draftScheduleData
            ] = await Promise.all([
                api.getSubjects(),
                api.getFaculty(),
                api.getClassrooms(),
                api.getDaysOfWeek(),
                api.getTimeSlots(),
                api.getDraftSchedule(),
            ]);
            setSubjects(subjectsData);
            setFaculty(facultyData);
            setClassrooms(classroomsData);
            setDays(daysData);
            setTimeSlots(timeSlotsData);

            if (draftScheduleData.length > 0) {
                const hydrated = hydrateSchedule(draftScheduleData, subjectsData, facultyData, classroomsData);
                setHydratedSchedule(hydrated);
            }
        } catch(err) {
            const errorMessage = 'Failed to load initial scheduling data.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Recalculate conflicts whenever the schedule or constraints change
    useEffect(() => {
        if (hydratedSchedule.length > 0) {
            const detected = detectConflicts(hydratedSchedule, subjects, constraints);
            setConflicts(detected);
        } else {
            setConflicts([]);
        }
    }, [hydratedSchedule, subjects, constraints]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError('');
        try {
            const generated = await geminiService.generateTimetable(subjects, faculty, classrooms, days, timeSlots, constraints);
            const hydrated = hydrateSchedule(generated, subjects, faculty, classrooms);
            setHydratedSchedule(hydrated);
            addToast('New schedule generated successfully!', 'success');
        } catch (err: any) {
            const errorMessage = err.message || 'An unexpected error occurred during generation.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        const [destDay, destTime] = destination.droppableId.split('|');
        
        setHydratedSchedule(prev => {
            const newSchedule = [...prev];
            const classIndex = newSchedule.findIndex(c => c.instance_id === draggableId);
            if(classIndex > -1) {
                newSchedule[classIndex].day = destDay;
                newSchedule[classIndex].time = destTime;
            }
            return newSchedule;
        });
    };

    const handleSaveDraft = async () => {
        try {
            const dehydrated = dehydrateSchedule(hydratedSchedule);
            await api.saveDraftSchedule(dehydrated);
            addToast('Draft schedule saved successfully!', 'success');
        } catch(err) {
            addToast('Failed to save draft.', 'error');
        }
    };
    
    const handlePublish = () => {
        if (conflicts.some(c => c.severity === 'error')) {
            addToast('Cannot publish with hard conflicts. Please resolve them first.', 'error');
            return;
        }
        setIsConfirmingPublish(true);
    };

    const executePublish = async () => {
        setIsConfirmingPublish(false);
        try {
            await handleSaveDraft(); // Ensure draft is saved first
            await api.publishSchedule();
            addToast('Schedule published successfully!', 'success');
        } catch(err) {
            addToast('Failed to publish schedule.', 'error');
        }
    };

    const handleFindReplacement = (classInfo: HydratedClassSchedule) => {
        setClassToReplace(classInfo);
    };

    // FIX: Changed newFacultyId type from number to string to match Faculty ID type.
    const handleSelectReplacement = (newFacultyId: string) => {
        if (classToReplace) {
             setHydratedSchedule(prev => {
                const newSchedule = [...prev];
                const classIndex = newSchedule.findIndex(c => c.instance_id === classToReplace.instance_id);
                if(classIndex > -1) {
                    newSchedule[classIndex].faculty_id = newFacultyId;
                    // Re-hydrate the single entry
                    const facultyMember = faculty.find(f => f.id === newFacultyId);
                    newSchedule[classIndex].faculty = facultyMember ? facultyMember.name : 'Unknown Faculty';
                }
                return newSchedule;
            });
        }
        setClassToReplace(null);
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Schedule Generator</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="constraints" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Constraints & Preferences</label>
                        <textarea
                            id="constraints"
                            rows={4}
                            value={constraints}
                            onChange={(e) => setConstraints(e.target.value)}
                            className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md shadow-sm text-sm dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., - Prof. Smith is unavailable on Fridays.&#10;- Physics I must be in a Lab."
                        />
                    </div>
                    <div className="flex flex-col justify-between">
                         <div className="space-y-2">
                             <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Actions</h4>
                             <div className="flex flex-wrap gap-2">
                                <button onClick={handleGenerate} disabled={isGenerating} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm disabled:bg-indigo-400 active:scale-95 transition-transform">
                                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                                </button>
                                <button onClick={handleSaveDraft} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-transform">
                                    Save Draft
                                </button>
                                <button onClick={handlePublish} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm active:scale-95 transition-transform">
                                    Publish
                                </button>
                            </div>
                        </div>
                        {error && !isGenerating && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
                    </div>
                </div>
            </div>

            {isGenerating && <Loader />}
            
            {!isGenerating && hydratedSchedule.length > 0 && (
                <>
                    <ConflictReport conflicts={conflicts} />
                    <TimetableGrid 
                        schedule={hydratedSchedule}
                        days={days}
                        timeSlots={timeSlots}
                        onDragEnd={handleDragEnd}
                        onFindReplacement={handleFindReplacement}
                    />
                </>
            )}

            {!isGenerating && hydratedSchedule.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400">Click "Generate with AI" to create a new schedule.</p>
                </div>
            )}

            <ReplacementFinderModal 
                classInfo={classToReplace}
                onClose={() => setClassToReplace(null)}
                onSelect={handleSelectReplacement}
            />
            <ConfirmationModal
                isOpen={isConfirmingPublish}
                onClose={() => setIsConfirmingPublish(false)}
                onConfirm={executePublish}
                title="Publish Schedule"
                message="Are you sure you want to publish this schedule? It will become the live timetable for all users."
                confirmText="Publish"
                confirmButtonClass="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            />
        </div>
    );
};

export default GeneratorView;

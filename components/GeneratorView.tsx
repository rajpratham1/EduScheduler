// components/GeneratorView.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DropResult } from '../libs/react-beautiful-dnd';
import { TimetableGrid } from './TimetableGrid';
import { Loader } from './Loader';
import ConflictReport from './ConflictReport';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import ReplacementFinderModal from './ReplacementFinderModal';
import * as api from '../services/api';
import * as geminiService from '../services/geminiService';
import { hydrateSchedule, dehydrateSchedule, getUniqueTimeSlots } from '../utils/scheduleUtils';
import { detectConflicts } from '../utils/conflictDetector';
import type { Conflict, HydratedClassSchedule, Subject, Faculty, Classroom, ClassSchedule } from '../types';
import { MagicWandIcon, CheckCircleIcon, CloudArrowUpIcon, DocumentArrowDownIcon } from './icons';

type ViewStatus = 'idle' | 'loading' | 'generating' | 'error';
type DraftStatus = 'synced' | 'unsaved' | 'saving';

const GeneratorView: React.FC = () => {
    const [viewStatus, setViewStatus] = useState<ViewStatus>('loading');
    const [draftStatus, setDraftStatus] = useState<DraftStatus>('synced');
    const [error, setError] = useState<string | null>(null);
    
    const [draftSchedule, setDraftSchedule] = useState<HydratedClassSchedule[]>([]);
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [constraints, setConstraints] = useState('');
    
    const [classToReplace, setClassToReplace] = useState<HydratedClassSchedule | null>(null);

    // Master Data
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [allFaculty, setAllFaculty] = useState<Faculty[]>([]);
    const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]);
    
    const timeSlots = useMemo(() => getUniqueTimeSlots(draftSchedule), [draftSchedule]);
    
    const loadInitialData = useCallback(async () => {
        setViewStatus('loading');
        try {
            const [subjects, faculty, classrooms, scheduleData] = await Promise.all([
                api.getSubjects(),
                api.getFaculty(),
                api.getClassrooms(),
                api.getDraftSchedule(),
            ]);
            setAllSubjects(subjects);
            setAllFaculty(faculty);
            setAllClassrooms(classrooms);
            setDraftSchedule(hydrateSchedule(scheduleData, subjects, faculty, classrooms));
            setConstraints("- Science classes must be in the Science Lab.\n- Mr. Smith is unavailable on Fridays.");
            setViewStatus('idle');
        } catch (e) {
            setError("Failed to load initial application data.");
            setViewStatus('error');
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        setConflicts(detectConflicts(draftSchedule, allSubjects, constraints));
    }, [draftSchedule, allSubjects, constraints]);

    const handleGenerate = async () => {
        setViewStatus('generating');
        setError(null);
        try {
            const generatedSchedule = await geminiService.generateTimetable({
                subjects: allSubjects,
                faculty: allFaculty,
                classrooms: allClassrooms,
                timeSlots: timeSlots.join(', '),
                constraints: constraints,
            });
            await handleSaveDraft(generatedSchedule);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during generation.');
            setViewStatus('error');
        } finally {
            if (viewStatus === 'generating') {
                setViewStatus('idle');
            }
        }
    };

    const handleSaveDraft = async (newSchedule?: Omit<ClassSchedule, 'id'>[]) => {
        setDraftStatus('saving');
        try {
            const scheduleToSave = newSchedule || dehydrateSchedule(draftSchedule);
            const savedData = await api.saveDraftSchedule(scheduleToSave);
            setDraftSchedule(hydrateSchedule(savedData, allSubjects, allFaculty, allClassrooms));
            setDraftStatus('synced');
        } catch(err) {
            setError("Failed to save draft.");
            setViewStatus('error');
            setDraftStatus('unsaved');
        }
    };

    const handlePublish = async () => {
        if (conflicts.some(c => c.severity === 'error')) {
            alert("Cannot publish a schedule with hard conflicts. Please resolve them first.");
            return;
        }
        if (draftStatus === 'unsaved') {
            if(!window.confirm("You have unsaved changes in your draft. Are you sure you want to publish the last saved version?")) {
                return;
            }
        }
        await api.publishSchedule();
        alert("Schedule published successfully! Faculty and students can now see the updated timetable.");
    };
    
    const handleDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination || !source) return;

        const updatedSchedule = [...draftSchedule];
        const movedClassIndex = updatedSchedule.findIndex(c => c.instance_id === draggableId);
        if (movedClassIndex === -1) return;

        const [movedClass] = updatedSchedule.splice(movedClassIndex, 1);
        
        const [destDay, destTime] = destination.droppableId.split('|');
        movedClass.day = destDay;
        movedClass.time = destTime;

        const targetSlotIndex = updatedSchedule.findIndex(c => c.day === destDay && c.time === destTime);
        
        if (targetSlotIndex > -1) {
            const classToSwap = updatedSchedule.splice(targetSlotIndex, 1)[0];
            const [sourceDay, sourceTime] = source.droppableId.split('|');
            classToSwap.day = sourceDay;
            classToSwap.time = sourceTime;
            updatedSchedule.push(classToSwap);
        }
        
        updatedSchedule.push(movedClass);

        setDraftSchedule(updatedSchedule);
        setDraftStatus('unsaved');
    };

    const handleSelectReplacement = (newFacultyId: number) => {
        if (!classToReplace) return;

        const updatedSchedule = draftSchedule.map(item => {
            if (item.instance_id === classToReplace.instance_id) {
                const newFacultyName = allFaculty.find(f => f.id === newFacultyId)?.name || 'Unknown';
                return { ...item, faculty_id: newFacultyId, faculty: newFacultyName };
            }
            return item;
        });

        setDraftSchedule(updatedSchedule);
        setDraftStatus('unsaved');
        setClassToReplace(null);
    };

    if (viewStatus === 'loading') {
        return <div className="text-center p-12"><p className="text-slate-500 dark:text-slate-400">Loading Generator...</p></div>;
    }

    const DraftStatusIndicator: React.FC = () => {
        if (draftStatus === 'saving') return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Saving...</span>;
        if (draftStatus === 'unsaved') return <span className="text-xs font-medium text-red-600 dark:text-red-400">Unsaved Changes</span>;
        return <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" /> Synced</span>;
    };

    return (
        <div className="space-y-8">
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Timetable Generation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Data Summary</h3>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-1">
                            <li><span className="font-medium text-slate-800 dark:text-slate-200">{allFaculty.length}</span> Faculty Members</li>
                            <li><span className="font-medium text-slate-800 dark:text-slate-200">{allSubjects.length}</span> Subjects</li>
                            <li><span className="font-medium text-slate-800 dark:text-slate-200">{allClassrooms.length}</span> Classrooms</li>
                        </ul>
                    </div>
                     <div>
                        <label htmlFor="constraints" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            High-Level Constraints
                        </label>
                        <textarea
                            id="constraints"
                            value={constraints}
                            onChange={(e) => setConstraints(e.target.value)}
                            rows={5}
                            disabled={viewStatus === 'generating'}
                            placeholder="e.g., - Mr. Smith is unavailable on Fridays."
                            className="block w-full text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-slate-200"
                        />
                    </div>
                </div>
                 <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
                    <button
                        onClick={handleGenerate}
                        disabled={viewStatus === 'generating'}
                        className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                    >
                        <MagicWandIcon className="w-5 h-5"/>
                        {viewStatus === 'generating' ? 'Generating...' : 'Generate Draft with AI'}
                    </button>
                     <div className="flex flex-wrap items-center gap-4">
                        <DraftStatusIndicator />
                        <button
                            onClick={() => handleSaveDraft()}
                            disabled={draftStatus !== 'unsaved'}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DocumentArrowDownIcon className="w-5 h-5"/>
                            Save Draft
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={conflicts.some(c => c.severity === 'error')}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm disabled:bg-green-400 disabled:cursor-not-allowed"
                        >
                            <CloudArrowUpIcon className="w-5 h-5" />
                            Publish
                        </button>
                    </div>
                 </div>
            </div>

            {viewStatus === 'generating' && <Loader />}
            {viewStatus === 'error' && <p className="text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-4 rounded-md">{error}</p>}
            
            {viewStatus !== 'generating' && draftSchedule.length > 0 && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Review and Edit Draft Schedule</h2>
                        <p className="text-slate-600 dark:text-slate-400">Drag and drop classes to make manual adjustments.</p>
                    </div>
                    <ConflictReport conflicts={conflicts} />
                    <TimetableGrid
                        schedule={draftSchedule}
                        timeSlots={timeSlots}
                        isEditable={true}
                        onDragEnd={handleDragEnd}
                        onFindReplacement={(classInfo) => setClassToReplace(classInfo)}
                    />
                    <AnalyticsDashboard schedule={draftSchedule} faculty={allFaculty} classrooms={allClassrooms} timeSlots={timeSlots} />
                </div>
            )}

            <ReplacementFinderModal 
                classInfo={classToReplace}
                onClose={() => setClassToReplace(null)}
                onSelect={handleSelectReplacement}
            />
        </div>
    );
};

export default GeneratorView;
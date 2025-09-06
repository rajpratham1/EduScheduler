// components/TimetableGrid.tsx
import React from 'react';
// FIX: Corrected import path
import type { HydratedClassSchedule } from '../types';
import { DragDropContext, Droppable, Draggable } from '../libs/react-beautiful-dnd';
import type { DropResult } from '../libs/react-beautiful-dnd';
import { UserCircleIcon, BuildingOfficeIcon, BookOpenIcon, ArrowPathIcon } from './icons';

interface TimetableGridProps {
    schedule: HydratedClassSchedule[];
    timeSlots: string[];
    days: string[];
    onDragEnd: (result: DropResult) => void;
    onFindReplacement: (classInfo: HydratedClassSchedule) => void;
}

const TimetableGrid: React.FC<TimetableGridProps> = ({ schedule, timeSlots, days, onDragEnd, onFindReplacement }) => {

    const getClassesForSlot = (day: string, time: string) => {
        return schedule.filter(c => c.day === day && c.time === time);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="overflow-x-auto bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border dark:border-slate-700">
                <div className="grid gap-px" style={{ gridTemplateColumns: `minmax(100px, 0.5fr) repeat(${days.length}, minmax(150px, 1fr))` }}>
                    {/* Header */}
                    <div className="sticky top-0 left-0 bg-slate-50 dark:bg-slate-900 z-20 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-tl-lg">Time</div>
                    {days.map(day => (
                        <div key={day} className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">{day}</div>
                    ))}
                    
                    {/* Body */}
                    {timeSlots.map((time) => (
                        <React.Fragment key={time}>
                            <div className="sticky left-0 bg-slate-50 dark:bg-slate-700/50 p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 self-stretch flex items-center justify-center">{time}</div>
                            {days.map(day => (
                                <Droppable key={`${day}-${time}`} droppableId={`${day}|${time}`}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`p-2 border-dashed border-slate-200 dark:border-slate-700 min-h-[100px] space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50 dark:bg-indigo-900/40' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}
                                        >
                                            {getClassesForSlot(day, time).map((classItem, index) => (
                                                <Draggable key={classItem.instance_id} draggableId={classItem.instance_id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`p-2.5 rounded-md shadow-sm border text-xs transition-all duration-200 ${snapshot.isDragging ? 'shadow-lg scale-105 bg-indigo-100 dark:bg-indigo-800' : 'bg-white dark:bg-slate-700'} border-slate-200 dark:border-slate-600`}
                                                        >
                                                            <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><BookOpenIcon className="w-3 h-3" />{classItem.subject}</p>
                                                            <p className="text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5"><UserCircleIcon className="w-3 h-3" />{classItem.faculty}</p>
                                                            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><BuildingOfficeIcon className="w-3 h-3" />{classItem.classroom}</p>
                                                            <button 
                                                                onClick={() => onFindReplacement(classItem)} 
                                                                className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] mt-2 flex items-center gap-1"
                                                            >
                                                               <ArrowPathIcon className="w-3 h-3" /> Find Replacement
                                                            </button>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </DragDropContext>
    );
};

export default TimetableGrid;
// components/TimetableGrid.tsx
import React from 'react';
import { DAYS_OF_WEEK } from '../constants';
import type { HydratedClassSchedule } from '../types';
import { generateICSFile } from '../utils/calendar';
import { CalendarPlusIcon, UserSwitchIcon } from './icons';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '../libs/react-beautiful-dnd';

interface TimetableGridProps {
    schedule: HydratedClassSchedule[];
    timeSlots: string[];
    isEditable?: boolean;
    onDragEnd?: OnDragEndResponder;
    onFindReplacement?: (classInfo: HydratedClassSchedule) => void;
    highlightFacultyId?: number;
}

const TimetableCell: React.FC<{ entry: HydratedClassSchedule, isEditable?: boolean, onFindReplacement?: (classInfo: HydratedClassSchedule) => void, highlightFacultyId?: number }> = ({ entry, isEditable, onFindReplacement, highlightFacultyId }) => {
    const isHighlighted = highlightFacultyId !== undefined && entry.faculty_id === highlightFacultyId;

    const handleExport = (e: React.MouseEvent) => {
        e.stopPropagation();
        generateICSFile(entry);
    };

    return (
        <div className={`bg-white dark:bg-slate-700/50 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200 dark:border-slate-700 min-h-[110px] flex flex-col justify-between relative group text-left ${isHighlighted ? 'ring-2 ring-offset-1 ring-indigo-500 dark:ring-indigo-400' : ''}`}>
            <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{entry.subject}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{entry.faculty}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{entry.classroom}</p>
            </div>
            <div className="absolute top-1 right-1 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleExport}
                    title="Add to calendar"
                    className="p-1.5 bg-slate-100 dark:bg-slate-600 rounded-full text-slate-500 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-500 hover:text-indigo-600 dark:hover:text-white"
                >
                    <CalendarPlusIcon className="w-4 h-4" />
                </button>
                {isEditable && onFindReplacement && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onFindReplacement(entry); }}
                        title="Find Replacement Faculty"
                        className="p-1.5 bg-slate-100 dark:bg-slate-600 rounded-full text-slate-500 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-500 hover:text-amber-600 dark:hover:text-white"
                    >
                        <UserSwitchIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export const TimetableGrid: React.FC<TimetableGridProps> = ({ schedule, timeSlots, isEditable = false, onDragEnd, onFindReplacement, highlightFacultyId }) => {
    const scheduleMap = new Map<string, HydratedClassSchedule>();
    schedule.forEach(item => {
        const key = `${item.day}-${item.time}`;
        scheduleMap.set(key, item);
    });

    const grid = (
        <div className="grid grid-cols-[auto_repeat(5,minmax(160px,1fr))] gap-2">
            {/* Header: Time Slots */}
            <div className="sticky left-0 bg-slate-100/80 dark:bg-slate-900/80 z-10 p-2 rounded-tl-lg"></div>
            {DAYS_OF_WEEK.map(day => (
                <div key={day} className="text-center font-bold text-slate-700 dark:text-slate-300 p-2 text-sm md:text-base">
                    {day}
                </div>
            ))}

            {/* Body */}
            {timeSlots.map(time => (
                <React.Fragment key={time}>
                    <div className="sticky left-0 bg-slate-100/80 dark:bg-slate-900/80 z-10 p-2 flex items-center justify-center rounded-l-lg">
                        <span className="font-semibold text-xs text-slate-600 dark:text-slate-400">{time}</span>
                    </div>
                    {DAYS_OF_WEEK.map(day => {
                        const key = `${day}-${time}`;
                        const entry = scheduleMap.get(key);
                        const droppableId = `${day}|${time}`;
                        return (
                            <Droppable key={key} droppableId={droppableId} isDropDisabled={!isEditable}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`p-1 rounded-md min-h-[120px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                                    >
                                        {entry ? (
                                            <Draggable draggableId={entry.instance_id} index={0} isDragDisabled={!isEditable}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{...provided.draggableProps.style, cursor: isEditable ? 'grab' : 'default'}}
                                                        className={snapshot.isDragging ? 'shadow-2xl' : ''}
                                                    >
                                                        <TimetableCell entry={entry} isEditable={isEditable} onFindReplacement={onFindReplacement} highlightFacultyId={highlightFacultyId} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ) : (
                                            <div className="h-full w-full"></div> // Empty droppable area
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg p-2 sm:p-4 md:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
                {isEditable && onDragEnd ? (
                    <DragDropContext onDragEnd={onDragEnd}>{grid}</DragDropContext>
                ) : (
                    grid
                )}
            </div>
        </div>
    );
};
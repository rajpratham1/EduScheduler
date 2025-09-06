// components/TimetableGrid.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '../libs/react-beautiful-dnd.ts';
import type { HydratedClassSchedule } from '../types.ts';
import { BookOpenIcon, UserCircleIcon, BuildingOfficeIcon, ArrowPathIcon } from './icons.tsx';

interface ClassCardProps {
    classInfo: HydratedClassSchedule;
    onFindReplacement: (classInfo: HydratedClassSchedule) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ classInfo, onFindReplacement }) => (
    <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-[11px] h-full flex flex-col justify-between group">
        <div>
            <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><BookOpenIcon className="w-3.5 h-3.5 flex-shrink-0" />{classInfo.subject}</p>
            <p className="text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5"><UserCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />{classInfo.faculty}</p>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><BuildingOfficeIcon className="w-3.5 h-3.5 flex-shrink-0" />{classInfo.classroom}</p>
        </div>
        <div className="mt-2 text-right">
             <button
                onClick={() => onFindReplacement(classInfo)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                title="Find replacement faculty"
            >
                <ArrowPathIcon className="w-3.5 h-3.5" />
            </button>
        </div>
    </div>
);

interface TimetableGridProps {
    schedule: HydratedClassSchedule[];
    days: string[];
    timeSlots: string[];
    onDragEnd: (result: DropResult) => void;
    onFindReplacement: (classInfo: HydratedClassSchedule) => void;
}

const TimetableGrid: React.FC<TimetableGridProps> = ({ schedule, days, timeSlots, onDragEnd, onFindReplacement }) => {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
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
                                <Droppable key={`${day}-${time}`} droppableId={`${day}|${time}`}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`p-2 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-50 dark:bg-slate-900'}`}
                                        >
                                            {schedule.filter(c => c.day === day && c.time === time).map((classItem, index) => (
                                                <Draggable key={classItem.instance_id} draggableId={classItem.instance_id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <motion.div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            layout
                                                            className={`mb-2 ${snapshot.isDragging ? 'shadow-2xl' : ''}`}
                                                        >
                                                            <ClassCard classInfo={classItem} onFindReplacement={onFindReplacement} />
                                                        </motion.div>
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
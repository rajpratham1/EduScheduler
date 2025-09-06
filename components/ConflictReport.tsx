// components/ConflictReport.tsx
import React from 'react';
import type { Conflict } from '../types.ts';
import { ExclamationTriangleIcon, CheckCircleIcon } from './icons.tsx';

interface ConflictReportProps {
    conflicts: Conflict[];
}

const ConflictReport: React.FC<ConflictReportProps> = ({ conflicts }) => {
    const hardConflicts = conflicts.filter(c => c.severity === 'error');
    const softConflicts = conflicts.filter(c => c.severity === 'warning');

    const colorMap = {
        red: {
            bg: 'bg-red-50/80 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-500/30',
            icon: 'text-red-400',
            title: 'text-red-800 dark:text-red-200',
            text: 'text-red-700 dark:text-red-300'
        },
        amber: {
            bg: 'bg-amber-50/80 dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-500/30',
            icon: 'text-amber-400',
            title: 'text-amber-800 dark:text-amber-200',
            text: 'text-amber-700 dark:text-amber-300'
        },
        green: {
            bg: 'bg-green-50/80 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-500/30',
            icon: 'text-green-400',
            title: 'text-green-800 dark:text-green-200',
            text: 'text-green-700 dark:text-green-300'
        }
    }

    const ConflictList: React.FC<{ list: Conflict[], title: string, icon: React.ReactNode, severity: 'red' | 'amber' }> = ({list, title, icon, severity}) => {
        const colors = colorMap[severity];
        return (
            <div className={`${colors.bg} ${colors.border} p-4 rounded-lg`}>
                <div className="flex">
                    <div className="flex-shrink-0">{icon}</div>
                    <div className="ml-3">
                        <h3 className={`text-sm font-medium ${colors.title}`}>{title}</h3>
                        <div className={`mt-2 text-sm ${colors.text}`}>
                            <ul role="list" className="list-disc pl-5 space-y-1">
                                {list.map((conflict, index) => <li key={index}>{conflict.message}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fadeInUp">
            {conflicts.length === 0 ? (
                <div className={`${colorMap.green.bg} ${colorMap.green.border} p-4 rounded-lg`}>
                     <div className="flex">
                        <div className="flex-shrink-0"><CheckCircleIcon className={`h-5 w-5 ${colorMap.green.icon}`} /></div>
                        <div className="ml-3">
                            <h3 className={`text-sm font-medium ${colorMap.green.title}`}>No Conflicts Detected</h3>
                            <p className={`mt-1 text-sm ${colorMap.green.text}`}>The current draft schedule appears to be valid.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {hardConflicts.length > 0 && 
                        <ConflictList 
                            list={hardConflicts} 
                            title={`${hardConflicts.length} Hard Conflict${hardConflicts.length > 1 ? 's' : ''} Detected`}
                            icon={<ExclamationTriangleIcon className="h-5 w-5 text-red-400" />}
                            severity="red"
                        />
                    }
                    {softConflicts.length > 0 && 
                        <ConflictList 
                            list={softConflicts} 
                            title={`${softConflicts.length} Soft Constraint Warning${softConflicts.length > 1 ? 's' : ''}`}
                            icon={<ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />}
                            severity="amber"
                        />
                    }
                </>
            )}
        </div>
    );
};

export default ConflictReport;
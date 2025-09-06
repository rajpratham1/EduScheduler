// components/SpecialClassManager.tsx
import React from 'react';
// FIX: Added file extension to import
import { CalendarDaysIcon } from './icons.tsx';

const SpecialClassManager: React.FC = () => {
    return (
        <div className="space-y-4">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CalendarDaysIcon className="w-6 h-6" />
                Special Events & Classes
            </h3>
             <div className="mt-4 text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">Management for one-off events or special classes is coming soon.</p>
            </div>
        </div>
    );
};

export default SpecialClassManager;

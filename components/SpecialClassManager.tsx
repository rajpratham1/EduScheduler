// components/SpecialClassManager.tsx
import React from 'react';
import { CalendarIcon } from './icons.tsx';

const SpecialClassManager: React.FC = () => {
    return (
        <div className="space-y-4">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                Special Events &amp; Holidays
            </h3>
             <div className="mt-4 text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">This feature is coming soon!</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Manage holidays, one-time events, and other schedule overrides here.</p>
            </div>
        </div>
    );
};

export default SpecialClassManager;

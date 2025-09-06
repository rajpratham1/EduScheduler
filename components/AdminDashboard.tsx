// components/AdminDashboard.tsx
import React, { useState } from 'react';
import GeneratorView from './GeneratorView.tsx';
import ManagementDashboard from './ManagementDashboard.tsx';
import AnalyticsDashboard from './AnalyticsDashboard.tsx';
import SavedTimetablesList from './SavedTimetablesList.tsx';

type Tab = 'generator' | 'management';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('generator');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex flex-wrap sm:flex-nowrap gap-x-8 gap-y-2" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('generator')}
                            className={`${
                                activeTab === 'generator'
                                    ? 'border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300 dark:hover:border-slate-600'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Timetable Generator
                        </button>
                        <button
                            onClick={() => setActiveTab('management')}
                            className={`${
                                activeTab === 'management'
                                    ? 'border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300 dark:hover:border-slate-600'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Data Management
                        </button>
                    </nav>
                </div>

                <div>
                    {activeTab === 'generator' && <GeneratorView />}
                    {activeTab === 'management' && <ManagementDashboard />}
                </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                 <AnalyticsDashboard />
                 <SavedTimetablesList />
            </div>
        </div>
    );
};

export default AdminDashboard;
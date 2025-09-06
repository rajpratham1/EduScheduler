// components/ManagementDashboard.tsx
import React from 'react';
import SubjectManager from './SubjectManager';
import FacultyManager from './FacultyManager';
import StudentManager from './StudentManager';
import ClassroomManager from './ClassroomManager';
import DepartmentManager from './DepartmentManager';
import ScheduleSettingsManager from './ScheduleSettingsManager';
import AnalyticsDashboard from './AnalyticsDashboard';

const ManagementDashboard: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                    <AnalyticsDashboard />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                        <DepartmentManager />
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                        <ScheduleSettingsManager />
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                    <SubjectManager />
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                    <ClassroomManager />
                </div>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                    <FacultyManager />
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                    <StudentManager />
                </div>
            </div>
        </div>
    );
};

export default ManagementDashboard;

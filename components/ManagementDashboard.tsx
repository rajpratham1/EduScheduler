// components/ManagementDashboard.tsx
import React from 'react';
import FacultyManager from './FacultyManager.tsx';
import StudentManager from './StudentManager.tsx';
import SubjectManager from './SubjectManager.tsx';
import ClassroomManager from './ClassroomManager.tsx';
import DepartmentManager from './DepartmentManager.tsx';
import ScheduleSettingsManager from './ScheduleSettingsManager.tsx';
import SpecialClassManager from './SpecialClassManager.tsx';

const ManagementDashboard: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                <FacultyManager />
            </div>
             <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                <StudentManager />
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                <SubjectManager />
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                <ClassroomManager />
            </div>
             <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                <DepartmentManager />
            </div>
             <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                <ScheduleSettingsManager />
            </div>
             <div className="md:col-span-2 lg:col-span-3 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                <SpecialClassManager />
            </div>
        </div>
    );
};

export default ManagementDashboard;

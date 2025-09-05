// components/ManagementDashboard.tsx
import React from 'react';
import FacultyManager from './FacultyManager';
import StudentManager from './StudentManager';
import SubjectManager from './SubjectManager';
import ClassroomManager from './ClassroomManager';
import DepartmentManager from './DepartmentManager';

const ManagementDashboard: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <FacultyManager />
            </div>
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <StudentManager />
            </div>
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <SubjectManager />
            </div>
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <ClassroomManager />
            </div>
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 lg:col-span-2">
                <DepartmentManager />
            </div>
        </div>
    );
};

export default ManagementDashboard;
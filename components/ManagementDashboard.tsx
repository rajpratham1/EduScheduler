// components/ManagementDashboard.tsx
import React, { useState } from 'react';
import SubjectManager from './SubjectManager.tsx';
import FacultyManager from './FacultyManager.tsx';
import StudentManager from './StudentManager.tsx';
import ClassroomManager from './ClassroomManager.tsx';
import DepartmentManager from './DepartmentManager.tsx';
import ScheduleSettingsManager from './ScheduleSettingsManager.tsx';

type ManagementTab = 'subjects' | 'faculty' | 'students' | 'classrooms' | 'departments' | 'settings';

const ManagementDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ManagementTab>('subjects');

    const renderContent = () => {
        switch (activeTab) {
            case 'subjects': return <SubjectManager />;
            case 'faculty': return <FacultyManager />;
            case 'students': return <StudentManager />;
            case 'classrooms': return <ClassroomManager />;
            case 'departments': return <DepartmentManager />;
            case 'settings': return <ScheduleSettingsManager />;
            default: return null;
        }
    };

    const TabButton: React.FC<{ tab: ManagementTab, label: string }> = ({ tab, label }) => (
         <button
            onClick={() => setActiveTab(tab)}
            className={`${
                activeTab === tab
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
            } px-3 py-1.5 text-sm font-medium rounded-md transition-colors`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Data Management</h2>
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                <TabButton tab="subjects" label="Subjects" />
                <TabButton tab="faculty" label="Faculty" />
                <TabButton tab="students" label="Students" />
                <TabButton tab="classrooms" label="Classrooms" />
                <TabButton tab="departments" label="Departments" />
                <TabButton tab="settings" label="Settings" />
            </div>
            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default ManagementDashboard;

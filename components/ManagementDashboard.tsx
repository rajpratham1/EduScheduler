// components/ManagementDashboard.tsx
import React from 'react';
// FIX: Added file extensions to imports
import SubjectManager from './SubjectManager.tsx';
import ClassroomManager from './ClassroomManager.tsx';
import DepartmentManager from './DepartmentManager.tsx';
import ScheduleSettingsManager from './ScheduleSettingsManager.tsx';
import FacultyManager from './FacultyManager.tsx';
import StudentManager from './StudentManager.tsx';
import AnalyticsDashboard from './AnalyticsDashboard.tsx';

const ManagementDashboard: React.FC = () => {
    return (
        <div className="space-y-8">
            <AnalyticsDashboard />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <SubjectManager />
                    <ClassroomManager />
                    <DepartmentManager />
                </div>
                <div className="space-y-8">
                    <FacultyManager />
                    <StudentManager />
                    <ScheduleSettingsManager />
                </div>
            </div>
        </div>
    );
};

export default ManagementDashboard;

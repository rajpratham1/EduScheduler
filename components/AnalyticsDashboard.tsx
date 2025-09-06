// components/AnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import * as api from '../services/api.ts';
import { UserGroupIcon, BookOpenIcon, BuildingOfficeIcon, ChartPieIcon } from './icons.tsx';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon }) => (
    <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
        <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    </div>
);


const AnalyticsDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        faculty: 0,
        students: 0,
        subjects: 0,
        classrooms: 0,
        utilization: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const [
                    facultyData,
                    studentData,
                    subjectData,
                    classroomData,
                    scheduleData,
                    daysData,
                    timeSlotsData,
                ] = await Promise.all([
                    api.getFaculty(),
                    api.getStudents(),
                    api.getSubjects(),
                    api.getClassrooms(),
                    api.getLatestSchedule(),
                    api.getDaysOfWeek(),
                    api.getTimeSlots(),
                ]);

                const totalSlots = classroomData.length * daysData.length * timeSlotsData.length;
                const usedSlots = scheduleData.length;
                const utilization = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

                setStats({
                    faculty: facultyData.length,
                    students: studentData.length,
                    subjects: subjectData.length,
                    classrooms: classroomData.length,
                    utilization: utilization,
                });
            } catch (error) {
                console.error("Failed to load analytics data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return <div className="p-4">Loading analytics...</div>;
    }

    return (
        <div className="space-y-4">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ChartPieIcon className="w-6 h-6" />
                University Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard title="Total Faculty" value={stats.faculty} icon={<UserGroupIcon className="w-6 h-6" />} />
                <MetricCard title="Total Students" value={stats.students} icon={<UserGroupIcon className="w-6 h-6" />} />
                <MetricCard title="Total Subjects" value={stats.subjects} icon={<BookOpenIcon className="w-6 h-6" />} />
                <MetricCard title="Total Classrooms" value={stats.classrooms} icon={<BuildingOfficeIcon className="w-6 h-6" />} />
            </div>
            <div>
                 <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Classroom Utilization</h4>
                 <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${stats.utilization}%` }}></div>
                </div>
                <p className="text-right text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">{stats.utilization}%</p>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
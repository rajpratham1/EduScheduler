import React, { useMemo } from 'react';
// Fix: Use relative paths for local module imports.
import type { HydratedClassSchedule, Faculty, Classroom } from '../types';
import { AnalyticsIcon, ClockIcon, UserGroupIcon, BuildingOfficeIcon } from './icons';

interface AnalyticsDashboardProps {
    schedule: HydratedClassSchedule[];
    faculty: Faculty[];
    classrooms: Classroom[];
    timeSlots: string[];
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; }> = ({ icon, title, value }) => (
    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center gap-4">
        <div className="bg-indigo-100 p-2 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ schedule, faculty, classrooms, timeSlots }) => {
    
    const analytics = useMemo(() => {
        const totalScheduled = schedule.length;
        const totalPossibleSlots = timeSlots.length * 5 * classrooms.length; // 5 days a week
        const utilization = totalPossibleSlots > 0 ? ((totalScheduled / totalPossibleSlots) * 100).toFixed(1) : 0;

        const facultyWorkload: { [key: string]: number } = {};
        faculty.forEach(f => {
            facultyWorkload[f.name] = 0;
        });
        schedule.forEach(s => {
            if (facultyWorkload.hasOwnProperty(s.faculty)) {
                facultyWorkload[s.faculty]++;
            }
        });

        return {
            totalScheduled,
            utilization,
            facultyWorkload: Object.entries(facultyWorkload).sort((a, b) => b[1] - a[1])
        };

    }, [schedule, faculty, classrooms, timeSlots]);

    return (
        <div className="mt-6 animate-fadeInUp">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Analytics Dashboard</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<ClockIcon className="w-5 h-5 text-indigo-600"/>} title="Total Classes Scheduled" value={analytics.totalScheduled} />
                <StatCard icon={<AnalyticsIcon className="w-5 h-5 text-indigo-600"/>} title="Classroom Utilization" value={`${analytics.utilization}%`} />
                <StatCard icon={<UserGroupIcon className="w-5 h-5 text-indigo-600"/>} title="Total Faculty" value={faculty.length} />
                <StatCard icon={<BuildingOfficeIcon className="w-5 h-5 text-indigo-600"/>} title="Total Classrooms" value={classrooms.length} />
            </div>
             <div className="mt-6 bg-white/50 backdrop-blur-lg p-4 rounded-xl shadow-lg border border-slate-200">
                <h4 className="text-md font-semibold text-slate-700 mb-2">Faculty Workload</h4>
                 <div className="max-h-40 overflow-y-auto pr-2">
                    {analytics.facultyWorkload.map(([name, hours]) => (
                        <div key={name} className="flex justify-between items-center text-sm py-1">
                            <span className="text-slate-600">{name}</span>
                            <span className="font-medium text-slate-800">{hours} classes</span>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

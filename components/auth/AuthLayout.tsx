// components/auth/AuthLayout.tsx
import React from 'react';
import { AcademicCapIcon } from '../icons';

interface AuthLayoutProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
    return (
        <div className="flex min-h-screen flex-col justify-center items-center bg-slate-100 dark:bg-slate-900 p-4">
            <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fadeInUp">
                <div className="flex justify-center items-center gap-2">
                    <AcademicCapIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">EduScheduler</h1>
                </div>
                <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
                <p className="mt-1 text-center text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fadeInUp" style={{animationDelay: '100ms'}}>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-200 dark:border-slate-700">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;

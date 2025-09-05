// components/Header.tsx
import React from 'react';
import type { User } from '../types';
import { UserCircleIcon, ArrowRightOnRectangleIcon, AcademicCapIcon, SunIcon, MoonIcon } from './icons';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, theme, toggleTheme }) => {
    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-3">
                        <AcademicCapIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 hidden sm:block">University Timetable Management System</h1>
                    </div>
                    {user && (
                        <div className="flex items-center gap-4">
                             <button
                                onClick={toggleTheme}
                                title="Toggle Theme"
                                className="inline-flex items-center justify-center w-9 h-9 border border-transparent text-sm font-medium rounded-full shadow-sm text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
                            >
                                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            </button>
                            <div className="flex items-center gap-2">
                                <UserCircleIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:inline">{user.name}</span>
                                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">{user.role}</span>
                            </div>
                            <button
                                onClick={onLogout}
                                title="Logout"
                                className="inline-flex items-center justify-center w-9 h-9 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
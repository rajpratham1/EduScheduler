// components/Header.tsx
import React, { useState } from 'react';
import type { User } from '../types';
import { AcademicCapIcon, SunIcon, MoonIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon } from './icons';
import { AVATARS } from './avatars';
import ProfileModal from './ProfileModal';
import ChangePasswordModal from './ChangePasswordModal';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onUserUpdate: (user: User) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, theme, toggleTheme, onUserUpdate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const AvatarComponent = AVATARS[user.avatar as keyof typeof AVATARS] || AVATARS.avatar1;

    return (
        <>
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <AcademicCapIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xl font-bold text-slate-800 dark:text-slate-200">EduScheduler</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            </button>
                            <div className="relative">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} onBlur={() => setTimeout(() => setIsMenuOpen(false), 200)} className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">{user.name}</span>
                                    <AvatarComponent className="w-9 h-9" />
                                </button>
                                {isMenuOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="px-4 py-2 border-b dark:border-slate-700">
                                            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                        </div>
                                        <button onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <Cog6ToothIcon className="w-4 h-4" /> Edit Profile
                                        </button>
                                        <button onClick={() => { setIsPasswordModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <Cog6ToothIcon className="w-4 h-4" /> Change Password
                                        </button>
                                        <button onClick={onLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                                            <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <ProfileModal user={user} isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onUpdate={onUserUpdate} />
            <ChangePasswordModal user={user} isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        </>
    );
};

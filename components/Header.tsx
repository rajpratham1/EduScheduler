// components/Header.tsx
import React, { useState } from 'react';
// FIX: Added file extensions to imports
import type { User } from '../types.ts';
import { AVATARS } from './avatars.ts';
import ChangePasswordModal from './ChangePasswordModal.tsx';
import ProfileModal from './ProfileModal.tsx';
import { SunIcon, MoonIcon, UserCircleIcon, AcademicCapIcon } from './icons.tsx';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onUserUpdate: (user: User) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, theme, toggleTheme, onUserUpdate }) => {
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const AvatarComponent = AVATARS[user.avatar as keyof typeof AVATARS] || UserCircleIcon;

    return (
        <>
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                             <AcademicCapIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">EduScheduler</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            </button>
                            <div className="relative">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} onBlur={() => setTimeout(() => setIsMenuOpen(false), 150)} className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300 hidden sm:inline">{user.name}</span>
                                    <AvatarComponent className="w-9 h-9" />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 border dark:border-slate-700">
                                        <button onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Edit Profile</button>
                                        <button onClick={() => { setIsPasswordModalOpen(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Change Password</button>
                                        <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                                        <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">Logout</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} onUpdate={onUserUpdate} />
            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} user={user} />
        </>
    );
};

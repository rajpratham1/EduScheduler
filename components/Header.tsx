// components/Header.tsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AVATARS } from './avatars.ts';
import type { User } from '../types.ts';
import { SunIcon, MoonIcon, AcademicCapIcon } from './icons.tsx';
import ProfileModal from './ProfileModal.tsx';
import ChangePasswordModal from './ChangePasswordModal.tsx';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    onUpdateUser: (user: User) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onUpdateUser }) => {
    const [isDark, setIsDark] = useState(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            return true;
        }
        return false;
    });

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    }, [isDark]);

    const AvatarComponent = AVATARS[user.avatar] || AVATARS['avatar1'];

    return (
        <>
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                             <AcademicCapIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                             <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 hidden sm:block">EduScheduler</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsDark(!isDark)}
                                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                            >
                                {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                            </button>
                            <div className="relative">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 focus:outline-none">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden md:inline">{user.name}</span>
                                    <AvatarComponent className="w-9 h-9 rounded-full" />
                                </button>
                                <AnimatePresence>
                                    {isMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
                                        >
                                            <div className="py-1">
                                                <button onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left">Edit Profile</button>
                                                <button onClick={() => { setIsPasswordModalOpen(true); setIsMenuOpen(false); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left">Change Password</button>
                                                <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">Logout</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <ProfileModal user={user} isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onUpdate={onUpdateUser} />
            <ChangePasswordModal user={user} isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        </>
    );
};

export default Header;
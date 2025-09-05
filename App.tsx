import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import StudentDashboard from './components/StudentDashboard';
import { Header } from './components/Header';
import * as api from './services/api';
import type { User } from './types';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useState<Theme>(localStorage.getItem('theme') as Theme || 'light');

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const checkSession = async () => {
            const user = await api.checkSession();
            setCurrentUser(user);
            setIsLoading(false);
        };
        checkSession();
    }, []);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        api.logout();
        setCurrentUser(null);
    };

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
                <p className="text-slate-500 dark:text-slate-400">Loading EduScheduler...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen font-sans">
            <Header user={currentUser} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {currentUser.role === 'admin' && <AdminDashboard />}
                {currentUser.role === 'faculty' && <FacultyDashboard user={currentUser} />}
                {currentUser.role === 'student' && <StudentDashboard user={currentUser} />}
            </main>
        </div>
    );
};

export default App;
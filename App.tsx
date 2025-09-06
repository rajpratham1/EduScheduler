
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ForcePasswordChangePage from './components/ForcePasswordChangePage';
import AdminDashboard from './components/AdminDashboard';
// FIX: Corrected import path
import FacultyDashboard from './components/FacultyDashboard';
// FIX: Corrected import path
import StudentDashboard from './components/StudentDashboard';
// FIX: Corrected import path
import { Header } from './components/Header';
// FIX: Corrected import path
import * as api from './services/api';
// FIX: Corrected import path
import type { User } from './types';
import { ToastProvider } from './contexts/ToastContext';

type Theme = 'light' | 'dark';
export type Page = 'login' | 'signup' | 'forgotPassword' | 'dashboard' | 'forcePasswordChange';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [page, setPage] = useState<Page>('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [authMessage, setAuthMessage] = useState('');
    const [theme, setTheme] = useState<Theme>(() => {
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            return 'dark';
        }
        return 'light';
    });

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
            if (!user) {
                setPage('login');
            } else if (user.forcePasswordChange) {
                setPage('forcePasswordChange');
            } else {
                setPage('dashboard');
            }
            setIsLoading(false);
        };
        checkSession();
    }, []);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        if (user.forcePasswordChange) {
            setPage('forcePasswordChange');
        } else {
            setPage('dashboard');
        }
    };

    const handleLogout = () => {
        api.logout();
        setCurrentUser(null);
        setPage('login');
    };

    const handlePasswordChanged = async () => {
        // Re-fetch user to clear the forcePasswordChange flag
        const user = await api.checkSession();
        setCurrentUser(user);
        setPage('dashboard');
    };
    
    const handleUserUpdate = (updatedUser: User) => {
        setCurrentUser(updatedUser);
    };

    const handleSignUpSuccess = () => {
        setAuthMessage('Registration successful! Please sign in with your new account.');
        setPage('login');
        // Clear the message after a few seconds so it doesn't persist on refresh
        setTimeout(() => setAuthMessage(''), 5000);
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

    const renderContent = () => {
        switch (page) {
            case 'login':
                return <LoginPage onLogin={handleLogin} onNavigate={setPage} message={authMessage} />;
            case 'signup':
                return <SignUpPage onSignUpSuccess={handleSignUpSuccess} onNavigate={setPage} />;
            case 'forgotPassword':
                return <ForgotPasswordPage onNavigate={setPage} />;
            case 'forcePasswordChange':
                return currentUser && <ForcePasswordChangePage user={currentUser} onPasswordChanged={handlePasswordChanged} onLogout={handleLogout} />;
            case 'dashboard':
                if (!currentUser) return <LoginPage onLogin={handleLogin} onNavigate={setPage} />;
                return (
                    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen font-sans">
                        <Header user={currentUser} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} onUserUpdate={handleUserUpdate} />
                        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                            {currentUser.role === 'admin' && <AdminDashboard />}
                            {currentUser.role === 'faculty' && <FacultyDashboard user={currentUser} />}
                            {currentUser.role === 'student' && <StudentDashboard user={currentUser} />}
                        </main>
                    </div>
                );
            default:
                return <LoginPage onLogin={handleLogin} onNavigate={setPage} />;
        }
    };
    
    return (
        <ToastProvider>
            {renderContent()}
        </ToastProvider>
    );
};

export default App;
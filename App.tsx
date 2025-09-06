// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage.tsx';
import SignUpPage from './components/SignUpPage.tsx';
import ForgotPasswordPage from './components/ForgotPasswordPage.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import StudentDashboard from './components/StudentDashboard.tsx';
import FacultyDashboard from './components/FacultyDashboard.tsx';
import Header from './components/Header.tsx';
import { ToastProvider, useToast } from './contexts/ToastContext.tsx';
import ForcePasswordChangePage from './components/ForcePasswordChangePage.tsx';
import type { User } from './types.ts';

export type Page = 'login' | 'signup' | 'forgotPassword' | 'forcePasswordChange' | 'dashboard';

const AppContent: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('login');
    const [loginMessage, setLoginMessage] = useState<string | undefined>(undefined);
    const { addToast } = useToast();

    useEffect(() => {
        // Check for saved user session
        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const user: User = JSON.parse(savedUser);
                setCurrentUser(user);
                if (user.force_password_change) {
                    setCurrentPage('forcePasswordChange');
                } else {
                    setCurrentPage('dashboard');
                }
            }
        } catch (error) {
            console.error("Failed to parse user from session storage", error);
            localStorage.removeItem('currentUser');
        }
    }, []);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.force_password_change) {
            setCurrentPage('forcePasswordChange');
        } else {
            setCurrentPage('dashboard');
            addToast(`Welcome back, ${user.name}!`, 'success');
        }
    };

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        setCurrentPage('login');
        setLoginMessage(undefined); // Clear any messages
        addToast("You have been logged out.", "success");
    }, [addToast]);
    
    const handleNavigate = (page: Page) => {
        setCurrentPage(page);
    };

    const handleSignUpSuccess = () => {
        setLoginMessage("Account created successfully! Please sign in.");
        setCurrentPage('login');
    };

    const handlePasswordChanged = () => {
        if (currentUser) {
            const updatedUser = { ...currentUser, force_password_change: false };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            setCurrentPage('dashboard');
        }
    };
    
    const handleUpdateUser = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        addToast("Profile updated!", "success");
    }

    const renderDashboard = () => {
        if (!currentUser) return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />;
        
        switch (currentUser.role) {
            case 'admin':
                return <AdminDashboard />;
            case 'faculty':
                return <FacultyDashboard user={currentUser} />;
            case 'student':
                return <StudentDashboard user={currentUser} />;
            default:
                return <div>Unknown role</div>;
        }
    };

    const renderPage = () => {
        if (currentPage === 'dashboard' && currentUser) {
            return (
                 <div className="flex flex-col h-screen">
                    <Header user={currentUser} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
                    <div className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        {renderDashboard()}
                    </div>
                </div>
            );
        }

        switch (currentPage) {
            case 'login':
                return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} message={loginMessage} />;
            case 'signup':
                return <SignUpPage onSignUpSuccess={handleSignUpSuccess} onNavigate={handleNavigate} />;
            case 'forgotPassword':
                return <ForgotPasswordPage onNavigate={handleNavigate} />;
            case 'forcePasswordChange':
                if (currentUser) {
                    return <ForcePasswordChangePage user={currentUser} onPasswordChanged={handlePasswordChanged} onLogout={handleLogout} />;
                }
                // If no user but on this page, redirect to login
                return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />;
            default:
                return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />;
        }
    }

    return (
        <main className="bg-slate-50 dark:bg-slate-900 min-h-screen font-sans antialiased">
            {renderPage()}
        </main>
    );
};


const App: React.FC = () => (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
);


export default App;

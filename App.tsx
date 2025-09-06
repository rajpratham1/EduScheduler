// App.tsx
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from './services/firebase.ts';

import LoginPage from './components/LoginPage.tsx';
import SignUpPage from './components/SignUpPage.tsx';
import ForgotPasswordPage from './components/ForgotPasswordPage.tsx';
import ForcePasswordChangePage from './components/ForcePasswordChangePage.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import FacultyDashboard from './components/FacultyDashboard.tsx';
import StudentDashboard from './components/StudentDashboard.tsx';
import Header from './components/Header.tsx';
import type { User } from './types.ts';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { Loader } from './components/Loader.tsx';

export type Page = 'login' | 'signup' | 'forgotPassword';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('login');
  const [loginMessage, setLoginMessage] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser({
                    ...userData,
                    id: userDoc.id,
                    uid: firebaseUser.uid,
                } as User);
            } else {
                // User exists in Auth but not Firestore, something is wrong
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    setPage('login');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  }

  const handlePasswordChanged = async () => {
    if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
                ...userData,
                id: userDoc.id,
                uid: auth.currentUser.uid,
            } as User);
        }
    }
  }

  const handleSignUpSuccess = () => {
    setLoginMessage('Account created successfully! Please sign in.');
    setPage('login');
  }
  
  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900"><Loader /></div>;
  }

  const renderDashboard = () => {
    if (!user) return null;

    if (user.force_password_change) {
        return <ForcePasswordChangePage user={user} onPasswordChanged={handlePasswordChanged} onLogout={handleLogout} />;
    }

    let dashboard;
    switch (user.role) {
      case 'admin':
        dashboard = <AdminDashboard />;
        break;
      case 'faculty':
        dashboard = <FacultyDashboard user={user} />;
        break;
      case 'student':
        dashboard = <StudentDashboard user={user} />;
        break;
      default:
        dashboard = <div>Unknown user role.</div>;
    }
    
    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen">
            <Header user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {dashboard}
            </main>
        </div>
    );
  };
  
  const renderAuthPage = () => {
    switch(page) {
        case 'signup':
            return <SignUpPage onSignUpSuccess={handleSignUpSuccess} onNavigate={setPage} />;
        case 'forgotPassword':
            return <ForgotPasswordPage onNavigate={setPage} />;
        case 'login':
        default:
            return <LoginPage onLogin={setUser} onNavigate={setPage} message={loginMessage} />;
    }
  }

  return (
    <ToastProvider>
        {user ? renderDashboard() : renderAuthPage()}
    </ToastProvider>
  );
}

export default App;
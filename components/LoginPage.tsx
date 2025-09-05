// components/LoginPage.tsx
import React, { useState } from 'react';
import * as api from '../services/api';
import type { User } from '../types';
import { AcademicCapIcon } from './icons';

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('admin@test.com');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await api.login(email);
            if (user) {
                onLogin(user);
            } else {
                setError('Invalid credentials. Please use one of the demo accounts.');
            }
        } catch (err) {
            setError('An error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <AcademicCapIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto" />
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4">University Timetable Management</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Please sign in to continue</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Email address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-center text-red-600 dark:text-red-400">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
                 <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border dark:border-slate-700">
                    <h4 className="font-semibold text-slate-600 dark:text-slate-300">Demo Accounts:</h4>
                    <ul className="list-disc list-inside mt-1">
                        <li><b>Admin:</b> admin@test.com</li>
                        <li><b>Faculty:</b> smith@test.com</li>
                        <li><b>Student:</b> alice@test.com</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
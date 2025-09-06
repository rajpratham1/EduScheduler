// components/LoginPage.tsx
import React, { useState } from 'react';
import * as api from '../services/api';
import type { User } from '../types';
import AuthLayout from './auth/AuthLayout';
import AuthInput from './auth/AuthInput';
import type { Page } from '../App';

interface LoginPageProps {
    onLogin: (user: User) => void;
    onNavigate: (page: Page) => void;
    message?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate, message }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await api.login(email, password);
            if (user) {
                onLogin(user);
            } else {
                setError('Invalid credentials. Please check your email and password.');
            }
        } catch (err) {
            setError('An error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Sign in to your account"
            subtitle="Welcome back to EduScheduler"
        >
            {message && (
                <div className="mb-4 text-center text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 p-3 rounded-md border border-green-200 dark:border-green-500/30">
                    {message}
                </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <AuthInput
                    id="email"
                    name="email"
                    type="email"
                    label="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                />
                <AuthInput
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                />

                <div className="flex items-center justify-between">
                    <div className="text-sm">
                        <button 
                            type="button" 
                            onClick={() => onNavigate('forgotPassword')}
                            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            Forgot your password?
                        </button>
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

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Not a member?{' '}
                <button 
                    type="button"
                    onClick={() => onNavigate('signup')}
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                    Sign up now
                </button>
            </p>
        </AuthLayout>
    );
};

export default LoginPage;
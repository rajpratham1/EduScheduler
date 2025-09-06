// components/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import * as api from '../services/api';
import AuthLayout from './auth/AuthLayout';
import AuthInput from './auth/AuthInput';
import type { Page } from '../App';

interface ForgotPasswordPageProps {
    onNavigate: (page: Page) => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await api.requestPasswordReset(email);
            setMessage(`A reset code has been sent to ${email}. (Hint: the mock code is 'reset123')`);
            setStep(2);
        } catch (err) {
            setError('No account found with that email address.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // In a real app, the code would be sent to the backend. Here we just use it for the API call.
            await api.resetPassword(email, newPassword, code);
            setMessage('Your password has been reset successfully! You can now sign in.');
            setTimeout(() => onNavigate('login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Is the code correct?');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Forgot your password?"
            subtitle="Enter your email to receive a reset code"
        >
            {step === 1 && (
                <form className="space-y-6" onSubmit={handleRequestReset}>
                    <AuthInput id="email" name="email" type="email" label="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
                    {error && <p className="text-sm text-center text-red-600 dark:text-red-400">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                        {isLoading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                </form>
            )}
             {step === 2 && (
                <form className="space-y-6" onSubmit={handleResetPassword}>
                    {message && <p className="text-sm text-center text-green-600 dark:text-green-400">{message}</p>}
                    <AuthInput id="code" name="code" type="text" label="Reset Code" value={code} onChange={e => setCode(e.target.value)} required />
                    <AuthInput id="newPassword" name="newPassword" type="password" label="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                    {error && <p className="text-sm text-center text-red-600 dark:text-red-400">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            )}
            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Remembered your password?{' '}
                <button type="button" onClick={() => onNavigate('login')} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Sign in
                </button>
            </p>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
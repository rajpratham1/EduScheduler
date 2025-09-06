// components/ForcePasswordChangePage.tsx
import React, { useState } from 'react';
import * as api from '../services/api.ts';
import type { User } from '../types.ts';
import AuthLayout from './auth/AuthLayout.tsx';
import AuthInput from './auth/AuthInput.tsx';
import { useToast } from '../contexts/ToastContext.tsx';

interface ForcePasswordChangePageProps {
    user: User;
    onPasswordChanged: () => void;
    onLogout: () => void;
}

const ForcePasswordChangePage: React.FC<ForcePasswordChangePageProps> = ({ user, onPasswordChanged, onLogout }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            // A temporary password was created when the admin added this user.
            // We assume the convention is the user's name (lowercase, no spaces) + '123'.
            // In a real production system, this would be handled via a secure, one-time token flow.
            const tempPassword = user.name.toLowerCase().replace(/\s/g, '') + '123';

            // FIX: Updated the api.changePassword call to match the new function signature.
            await api.changePassword(tempPassword, newPassword);
            
            addToast("Password updated successfully!", 'success');
            onPasswordChanged();
        } catch (err: any) {
            const errorMessage = err.message || 'An error occurred while updating your password.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Set Your New Password"
            subtitle={`Welcome, ${user.name}! For security, please create a new password for your account.`}
        >
            <form className="space-y-6" onSubmit={handleSubmit}>
                <AuthInput
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <AuthInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                {error && <p className="text-sm text-center text-red-600 dark:text-red-400">{error}</p>}

                <div className="flex items-center justify-between gap-4">
                     <button
                        type="button"
                        onClick={onLogout}
                        className="w-full flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        Logout
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                    >
                        {isLoading ? 'Saving...' : 'Set Password and Continue'}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};

export default ForcePasswordChangePage;

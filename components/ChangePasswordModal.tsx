// components/ChangePasswordModal.tsx
import React, { useState } from 'react';
import * as api from '../services/api.ts';
import type { User } from '../types.ts';

interface ChangePasswordModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ user, isOpen, onClose }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        setIsLoading(false);
    }

    const handleClose = () => {
        resetForm();
        onClose();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        try {
            // FIX: Updated the api.changePassword call to match the new function signature.
            await api.changePassword(oldPassword, newPassword);
            setSuccess('Password changed successfully!');
            setTimeout(handleClose, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to change password.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md animate-fadeInUp" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Change Your Password</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Old Password</label>
                            <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md shadow-sm text-sm dark:text-slate-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md shadow-sm text-sm dark:text-slate-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md shadow-sm text-sm dark:text-slate-200" />
                        </div>
                        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
                        {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg flex justify-end gap-3">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm disabled:bg-indigo-400">
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;

// components/ProfileModal.tsx
import React, { useState, useEffect } from 'react';
import * as api from '../services/api.ts';
import type { User } from '../types.ts';
import { AVATARS } from './avatars.ts';

interface ProfileModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (user: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(user.name);
            setSelectedAvatar(user.avatar);
            setError('');
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Name cannot be empty.');
            return;
        }
        setIsLoading(true);
        try {
            const updatedUser = await api.updateUserProfile(user.id, { name, avatar: selectedAvatar });
            onUpdate(updatedUser);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg animate-fadeInUp" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Your Profile</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        <div>
                            <label htmlFor="profileName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
                            <input
                                id="profileName"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md shadow-sm text-sm dark:text-slate-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Choose your avatar</label>
                            <div className="mt-2 grid grid-cols-5 sm:grid-cols-6 gap-3">
                                {Object.entries(AVATARS).map(([key, AvatarComponent]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedAvatar(key)}
                                        className={`rounded-full p-1 transition-all ${selectedAvatar === key ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800' : 'hover:scale-110'}`}
                                        aria-label={`Select avatar ${key}`}
                                    >
                                        <AvatarComponent className="w-12 h-12 text-slate-600 dark:text-slate-300" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
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

export default ProfileModal;
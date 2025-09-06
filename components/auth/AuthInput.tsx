// components/auth/AuthInput.tsx
import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const AuthInput: React.FC<AuthInputProps> = ({ label, id, ...props }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <div className="mt-1">
                <input
                    id={id}
                    {...props}
                    className="block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-slate-900 dark:text-slate-200"
                />
            </div>
        </div>
    );
};

export default AuthInput;

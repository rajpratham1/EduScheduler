// components/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import AuthLayout from './auth/AuthLayout.tsx';
import AuthInput from './auth/AuthInput.tsx';
import type { Page } from '../App.tsx';

interface ForgotPasswordPageProps {
    onNavigate: (page: Page) => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would trigger an API call.
        // Here, we just move to the success state.
        setSubmitted(true);
    };

    return (
        <AuthLayout
            title={submitted ? "Check your email" : "Forgot your password?"}
            subtitle={submitted ? `We've sent password reset instructions to ${email}.` : "No worries, we'll send you reset instructions."}
        >
            {!submitted ? (
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
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Reset Password
                        </button>
                    </div>
                </form>
            ) : (
                <div className="text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Didn't receive the email? Check your spam folder, or try again.
                    </p>
                </div>
            )}

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                <button 
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                    Back to Sign in
                </button>
            </p>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
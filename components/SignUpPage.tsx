// components/SignUpPage.tsx
import React, { useState } from 'react';
// FIX: Add file extension to import
import * as api from '../services/api.ts';
import AuthLayout from './auth/AuthLayout.tsx';
import AuthInput from './auth/AuthInput.tsx';
import type { Page } from '../App.tsx';

interface SignUpPageProps {
    onSignUpSuccess: () => void;
    onNavigate: (page: Page) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUpSuccess, onNavigate }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'faculty'>('student');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleGetOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await api.sendOtp(mobile);
            setStep(2);
        } catch(err) {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (otp !== '123456') { // Mock OTP check
            setError('Invalid OTP. Please try again.');
            return;
        }
        setIsLoading(true);
        try {
            await api.signUp({
                name,
                email,
                mobile_number: mobile,
                role,
                password,
            });
            // On success, trigger the navigation to the login page with a message
            onSignUpSuccess();
        } catch (err: any) {
            setError(err.message || 'An error occurred during sign up.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={step === 1 ? "Create an account" : "Verify your number"}
            subtitle={step === 1 ? "Start your journey with EduScheduler" : `Enter the OTP sent to ${mobile}`}
        >
            {step === 1 && (
                 <form className="space-y-4" onSubmit={handleGetOtp}>
                    <AuthInput id="name" name="name" type="text" label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                    <AuthInput id="email" name="email" type="email" label="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
                    <AuthInput id="mobile" name="mobile" type="tel" label="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} required />
                    <AuthInput id="password" name="password" type="password" label="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">I am a...</label>
                        <div className="mt-2 flex gap-4">
                           <label className="inline-flex items-center"><input type="radio" value="student" checked={role==='student'} onChange={() => setRole('student')} className="form-radio" /> <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">Student</span></label>
                           <label className="inline-flex items-center"><input type="radio" value="faculty" checked={role==='faculty'} onChange={() => setRole('faculty')} className="form-radio" /> <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">Faculty</span></label>
                        </div>
                    </div>
                     {error && <p className="text-sm text-center text-red-600 dark:text-red-400">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                        {isLoading ? 'Sending OTP...' : 'Get OTP'}
                    </button>
                 </form>
            )}

            {step === 2 && (
                <form className="space-y-6" onSubmit={handleSignUp}>
                    <AuthInput id="otp" name="otp" type="text" label="One-Time Password" value={otp} onChange={e => setOtp(e.target.value)} required />
                    {error && <p className="text-sm text-center text-red-600 dark:text-red-400">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                        {isLoading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>
            )}

             <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <button type="button" onClick={() => onNavigate('login')} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Sign in
                </button>
            </p>
        </AuthLayout>
    );
};

export default SignUpPage;
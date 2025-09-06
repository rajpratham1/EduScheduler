// components/InputForm.tsx
import React from 'react';

interface InputFormProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
}

const InputForm: React.FC<InputFormProps> = ({ label, value, onChange, type = 'text', placeholder }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md shadow-sm text-sm dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
    );
};

export default InputForm;

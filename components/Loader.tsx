
import React, { useState, useEffect } from 'react';
import { MagicWandIcon } from './icons.tsx';

const loadingMessages = [
  "Initializing AI scheduling engine...",
  "Analyzing constraints and preferences...",
  "Evaluating thousands of possibilities...",
  "Optimizing faculty and classroom allocation...",
  "Resolving potential conflicts...",
  "Finalizing the optimal schedule...",
];

export const Loader: React.FC = () => {
    const [message, setMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        let index = 0;
        const intervalId = setInterval(() => {
            index = (index + 1) % loadingMessages.length;
            setMessage(loadingMessages[index]);
        }, 2000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute top-0 -right-2 w-4 h-4 bg-amber-300 rounded-full sparkle-1 mix-blend-multiply dark:mix-blend-lighten opacity-70"></div>
                <div className="absolute top-8 -left-4 w-3 h-3 bg-sky-400 rounded-full sparkle-2 mix-blend-multiply dark:mix-blend-lighten opacity-70"></div>
                <div className="absolute bottom-1 right-0 w-5 h-5 bg-rose-400 rounded-full sparkle-3 mix-blend-multiply dark:mix-blend-lighten opacity-70"></div>
                <MagicWandIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mt-6 text-slate-700 dark:text-slate-200">Generating Your Timetable...</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 transition-opacity duration-500">{message}</p>
        </div>
    );
};
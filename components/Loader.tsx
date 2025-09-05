
import React, { useState, useEffect } from 'react';
import { MagicWandIcon } from './icons';

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
            <div className="relative">
                <MagicWandIcon className="w-16 h-16 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mt-6 text-slate-700 dark:text-slate-200">Generating Your Timetable...</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 transition-opacity duration-500">{message}</p>
        </div>
    );
};
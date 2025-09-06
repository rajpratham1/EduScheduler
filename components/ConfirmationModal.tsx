// components/ConfirmationModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from './icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-start">
                                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${confirmButtonClass.includes('red') ? 'bg-red-100 dark:bg-red-900/50' : 'bg-indigo-100 dark:bg-indigo-900/50'} sm:mx-0 sm:h-10 sm:w-10`}>
                                    <ExclamationTriangleIcon className={`h-6 w-6 ${confirmButtonClass.includes('red') ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}`} aria-hidden="true" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg leading-6 font-bold text-slate-900 dark:text-slate-100" id="modal-title">
                                        {title}
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm ${confirmButtonClass}`}
                                onClick={() => {
                                    onConfirm();
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;

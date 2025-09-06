// contexts/ToastContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationTriangleIcon } from '../components/icons';

type ToastType = 'success' | 'error';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.5 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 w-full max-w-sm p-4 rounded-lg shadow-lg text-sm font-medium border
                ${toast.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-500/30' 
                  : 'bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-500/30'
                }`}
            >
                {toast.type === 'success' 
                    ? <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    : <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                }
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

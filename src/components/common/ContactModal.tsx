import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import ContactForm from './ContactForm';

interface ContactModalProps {
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Contact for Admin Access</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <a
            href="https://wa.me/916200892887"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300"
          >
            <MessageSquare className="h-5 w-5" />
            <span>Contact on WhatsApp</span>
          </a>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">OR</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Submit the form below and we will get back to you via email.
          </p>

          <ContactForm />
        </div>
      </div>
    </div>
  );
};

export default ContactModal;

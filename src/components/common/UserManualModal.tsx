import React from 'react';
import { X } from 'lucide-react';

interface UserManualModalProps {
  onClose: () => void;
}

const UserManualModal: React.FC<UserManualModalProps> = ({ onClose }) => {
  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3">{children}</h3>
  );

  const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="text-gray-600 dark:text-gray-300 leading-relaxed">{children}</li>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-3xl w-full transform transition-all duration-300 scale-100 flex flex-col" style={{maxHeight: '90vh'}}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">EduScheduler User Manual</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto pr-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Welcome to EduScheduler! This guide explains the key features for each type of user.</p>

          <SectionTitle>General Features</SectionTitle>
          <ul className="list-disc list-inside space-y-2">
            <ListItem><strong>Theme Toggle:</strong> Switch between light and dark modes using the sun/moon icon in the header.</ListItem>
            <ListItem><strong>Language Selection:</strong> Change the website's language using the globe icon in the header.</ListItem>
          </ul>

          <SectionTitle>Student Portal</SectionTitle>
          <ul className="list-disc list-inside space-y-2">
            <ListItem><strong>Signup:</strong> New students can register using the 'Register as Student' button. Your account must be approved by an administrator before you can log in.</ListItem>
            <ListItem><strong>Login:</strong> Access your portal using your email and password.</ListItem>
            <ListItem><strong>Dashboard:</strong> View your personalized class schedule, upcoming assignments, and important announcements.</ListItem>
            <ListItem><strong>Profile Management:</strong> Keep your personal information up to date.</ListItem>
          </ul>

          <SectionTitle>Faculty Portal</SectionTitle>
          <ul className="list-disc list-inside space-y-2">
            <ListItem><strong>Login:</strong> Use your assigned email, password, and the secret code provided by the administrator to log in.</ListItem>
            <ListItem><strong>Dashboard:</strong> Get an overview of your teaching schedule and assigned classes.</ListItem>
            <ListItem><strong>Assignment Management:</strong> Create, distribute, and manage assignments for your courses.</ListItem>
            <ListItem><strong>Attendance Tracking:</strong> Mark and monitor student attendance for your lectures.</ListItem>
          </ul>

          <SectionTitle>Admin Portal</SectionTitle>
          <ul className="list-disc list-inside space-y-2">
            <ListItem><strong>Full Control Dashboard:</strong> Access a comprehensive overview of the entire institution's operations.</ListItem>
            <ListItem><strong>User Management:</strong> Approve new student accounts and manage all student and faculty profiles.</ListItem>
            <ListItem><strong>Academic Structure:</strong> Create and manage Departments, Subjects, and Classrooms.</ListItem>
            <ListItem><strong>Schedule Generation:</strong> Manually build or use the powerful AI Assistant to automatically generate conflict-free class schedules and timetables.</ListItem>
            <ListItem><strong>Announcements:</strong> Create, edit, and publish announcements for different user groups.</ListItem>
            <ListItem><strong>Security:</strong> Manage the secret codes required for faculty registration and login.</ListItem>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserManualModal;

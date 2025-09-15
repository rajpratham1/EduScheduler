import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from 'src/contexts/AuthContext.jsx';
import DashboardLayout from 'src/layouts/DashboardLayout';
import AdminLayout from 'src/layouts/AdminLayout';
import PrivateRoute from 'src/components/PrivateRoute';
import RoleBasedDashboard from 'src/components/RoleBasedDashboard';
import ProfilePage from 'src/pages/ProfilePage';
import HomePage from 'src/pages/HomePage';
import FacultyPage from 'src/pages/admin/FacultyPage';
import StudentsPage from 'src/pages/admin/StudentsPage';
import SubjectsPage from 'src/pages/admin/SubjectsPage';
import ClassroomsPage from 'src/pages/admin/ClassroomsPage';
import TimetablesPage from 'src/pages/admin/TimetablesPage';
import UserManagementPage from 'src/pages/admin/UserManagementPage';
import CoursesPage from 'src/pages/admin/CoursesPage';
import AssignmentsPage from 'src/pages/admin/AssignmentsPage';
import FeedbackSettingsPage from 'src/pages/admin/FeedbackSettingsPage'; // Import the new page
import ElectivesPage from 'src/pages/ElectivesPage';
import CulturalSessionsPage from 'src/pages/CulturalSessionsPage';
import PendingApprovalPage from 'src/pages/PendingApprovalPage';
import './App.css';

function App() {
  const [theme, setTheme] = useState('light'); // Default theme is light

  useEffect(() => {
    document.body.className = theme + '-theme';
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <AuthProvider>
        <button onClick={toggleTheme} className="theme-toggle-button">
          Switch to {theme === 'light' ? 'Dark' : 'Light'} Theme
        </button>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="home" element={<RoleBasedDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="electives" element={<ElectivesPage />} />
            <Route path="cultural-sessions" element={<CulturalSessionsPage />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route path="faculty" element={<FacultyPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="subjects" element={<SubjectsPage />} />
              <Route path="classrooms" element={<ClassroomsPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="timetables" element={<TimetablesPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="settings" element={<FeedbackSettingsPage />} />
            </Route>
          </Route>
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AdminLogin from './components/AdminLogin';
import ForgotPassword from './components/auth/ForgotPassword';
import AdminSignup from './components/auth/AdminSignup';
import FacultyLogin from './components/FacultyLogin';
import AdminDashboard from './components/AdminDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import StudentSignup from './components/StudentSignup';
import StudentLogin from './components/StudentLogin';
import StudentDashboard from './components/StudentDashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      {/* Admin Routes */}
      <Route 
        path="/admin/signup" 
        element={user && user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <AdminSignup />} 
      />
      <Route 
        path="/admin/login" 
        element={user && user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <AdminLogin />} 
      />
      <Route 
        path="/admin/forgot-password" 
        element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <ForgotPassword />} 
      />
      <Route 
        path="/admin/dashboard" 
        element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/admin/login" />} 
      />
      
      {/* Faculty Routes */}
      <Route 
        path="/faculty/login" 
        element={user && user.role === 'faculty' ? <Navigate to="/faculty/dashboard" /> : <FacultyLogin />} 
      />
      <Route 
        path="/faculty/dashboard" 
        element={user && user.role === 'faculty' ? <FacultyDashboard /> : <Navigate to="/faculty/login" />} 
      />
      
      {/* Student Routes */}
      <Route 
        path="/student/signup" 
        element={user && user.role === 'student' ? <Navigate to="/student/dashboard" /> : <StudentSignup />} 
      />
      <Route 
        path="/student/login" 
        element={user && user.role === 'student' ? <Navigate to="/student/dashboard" /> : <StudentLogin />} 
      />
      <Route 
        path="/student/dashboard" 
        element={user && user.role === 'student' ? <StudentDashboard /> : <Navigate to="/student/login" />} 
      />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300">
              <AppRoutes />
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
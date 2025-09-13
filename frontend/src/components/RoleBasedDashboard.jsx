import React, { useState, useEffect } from 'react';
import { useAuth } from 'src/contexts/AuthContext.jsx';
import AdminDashboard from 'src/pages/AdminDashboard';
import FacultyTimetablePage from 'src/pages/FacultyTimetablePage';
import StudentTimetablePage from 'src/pages/StudentTimetablePage';

function RoleBasedDashboard() {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://127.0.0.1:8000/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUserRole(data.role);
      setLoading(false);
    };

    if (currentUser) {
      fetchUserRole();
    }
  }, [currentUser]);

  if (loading) return <div>Loading dashboard...</div>;

  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'faculty':
      return <FacultyTimetablePage />;
    case 'student':
      return <StudentTimetablePage />;
    default:
      return <div>Unknown role</div>;
  }
}

export default RoleBasedDashboard;
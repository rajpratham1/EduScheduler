import React from 'react';
import { useAuth } from 'src/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      localStorage.removeItem('accessToken');
      navigate('/login');
    } catch {
      console.error('Failed to log out');
    }
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {currentUser && <p>Welcome, {currentUser.email}</p>}
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}

export default DashboardPage;

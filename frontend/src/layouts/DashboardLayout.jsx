import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import './DashboardLayout.css';

function DashboardLayout() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <nav className="sidebar">
        <h2>EduScheduler</h2>
        <ul>
          <li><Link to="/dashboard">Home</Link></li>
          <li><Link to="/dashboard/profile">Profile</Link></li>
          {/* Add more role-specific links here */}
        </ul>
        <button onClick={logout} className="logout-button">Logout</button>
      </nav>
      <main className="main-content">
        <header className="header">
          {currentUser && <span>Welcome, {currentUser.displayName || currentUser.email}</span>}
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;

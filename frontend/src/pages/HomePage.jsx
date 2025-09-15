import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from 'src/services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from 'src/contexts/AuthContext';
import './HomePage.css'; // For animations and styling
import '../components/Modal.css'; // For the new modal

function HomePage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [showAdminIdModal, setShowAdminIdModal] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [idToken, setIdToken] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.body.className = 'light-theme';
  }, []);

  const performLogin = async (token, adminId = null) => {
    setError('');
    try {
      const payload = { token: token };
      if (adminId) {
        payload.admin_id = adminId;
      }

      const response = await fetch('https://eduscheduler-m5jz.onrender.com/api/v1/auth/login/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.access_token); // Use useAuth hook to set token
        navigate('/dashboard');
      } else {
        switch (data.detail) {
          case 'NEW_STUDENT_MISSING_ADMIN_ID':
            setIdToken(token);
            setShowAdminIdModal(true);
            break;
          case 'ACCOUNT_PENDING_APPROVAL':
            navigate('/pending-approval');
            break;
          case 'ACCOUNT_REJECTED':
            setError('Your account registration has been rejected. Please contact an administrator.');
            break;
          default:
            setError(data.detail || 'An unknown error occurred.');
            break;
        }
      }
    } catch (err) {
      console.error('Backend interaction error', err);
      setError('Failed to connect to the server.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      await performLogin(token);
    } catch (error) {
      console.error('Google sign-in error', error);
      setError('Google sign-in failed. Please try again.');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('https://eduscheduler-m5jz.onrender.com/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.access_token); // Use useAuth hook to set token
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Admin login failed.');
      }
    } catch (err) {
      console.error('Admin login error', err);
      setError('Failed to connect to the server for admin login.');
    }
  };

  const handleAdminIdSubmit = async (e) => {
    e.preventDefault();
    if (adminId && idToken) {
      setShowAdminIdModal(false);
      await performLogin(idToken, adminId);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="page-title">Welcome to EduScheduler</h1>
        <p>Please sign in to continue</p>

        {/* Google Login */}
        <button onClick={handleGoogleLogin} className="google-login-button">
          Sign in with Google
        </button>

        {/* Admin Login */}
        <form onSubmit={handleAdminLogin} className="admin-login-form">
          <h2>Admin Login</h2>
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="admin-login-button">Login as Admin</button>
        </form>

        {error && <p className="login-error">{error}</p>}
      </div>

      {showAdminIdModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Student Registration</h2>
            <p>Please enter the Admin ID provided by your institution to request access.</p>
            <form onSubmit={handleAdminIdSubmit}>
              <input
                type="text"
                className="modal-input"
                placeholder="Enter Admin ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                required
              />
              <div className="modal-actions">
                <button type="submit" className="modal-button primary">Submit for Approval</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
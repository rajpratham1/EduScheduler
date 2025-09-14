import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from 'src/services/firebase';
import { signInWithPopup } from 'firebase/auth';
import './LoginPage.css'; // For animations and styling
import '../components/Modal.css'; // For the new modal

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showAdminIdModal, setShowAdminIdModal] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [idToken, setIdToken] = useState(null);

  useEffect(() => {
    document.body.className = 'light-theme';
  }, []);

  const performLogin = async (idToken, adminId = null) => {
    setError('');
    try {
      const payload = { token: idToken };
      if (adminId) {
        payload.admin_id = adminId;
      }

      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/auth/login/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('accessToken', data.access_token);
        navigate('/dashboard');
      } else {
        switch (data.detail) {
          case 'NEW_STUDENT_MISSING_ADMIN_ID':
            // First time student, ask for Admin ID
            setIdToken(idToken);
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
        <button onClick={handleGoogleLogin} className="google-login-button">
          Sign in with Google
        </button>
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

export default LoginPage;
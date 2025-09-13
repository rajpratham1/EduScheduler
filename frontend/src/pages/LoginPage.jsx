import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from 'src/services/firebase';
import { signInWithPopup } from 'firebase/auth';
import './LoginPage.css'; // For animations and styling

function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure the body always has the light-theme class on this page
    document.body.className = 'light-theme';

    // Optional: Clean up when component unmounts if you want to revert to global theme
    // This might not be necessary if the theme is managed globally by App.jsx
    return () => {
      // You might want to restore the previous theme here if needed
      // For now, we assume App.jsx will handle the theme for other pages
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Send the token to your backend
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.access_token);
        navigate('/dashboard'); // Redirect to a protected route
      } else {
        // Handle login failure
        console.error('Backend login failed');
      }
    } catch (error) {
      console.error('Google sign-in error', error);
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
      </div>
    </div>
  );
}

export default LoginPage;

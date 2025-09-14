import React, { useState, useEffect } from 'react';
import './FeedbackSettingsPage.css';

function FeedbackSettingsPage() {
  const [googleFormLink, setGoogleFormLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const token = localStorage.getItem('accessToken');
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/settings/feedback-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to fetch feedback settings');
      }
      const data = await response.json();
      setGoogleFormLink(data.google_form_link || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      const token = localStorage.getItem('accessToken');
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/settings/feedback-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ google_form_link: googleFormLink }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to save feedback settings');
      }
      setMessage('Feedback settings saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="feedback-settings-container">Loading...</div>;

  return (
    <div className="feedback-settings-container">
      <h2>Manage Feedback Form Link</h2>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
      <form onSubmit={handleSubmit}>
        <label>
          Google Form Link:
          <input
            type="url"
            value={googleFormLink}
            onChange={(e) => setGoogleFormLink(e.target.value)}
            placeholder="Enter Google Form URL"
            required
          />
        </label>
        <button type="submit">Save Settings</button>
      </form>
    </div>
  );
}

export default FeedbackSettingsPage;

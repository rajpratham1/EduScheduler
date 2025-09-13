import React, { useState } from 'react';

function FeedbackForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending feedback...');
    try {
      const token = localStorage.getItem('accessToken');
            const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, message }),
      });

      if (response.ok) {
        setStatus('Feedback sent successfully!');
        setSubject('');
        setMessage('');
      } else {
        setStatus('Failed to send feedback.');
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="feedback-form">
      <h3>Submit Feedback</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <textarea
          placeholder="Your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="5"
          required
        ></textarea>
        <button type="submit">Send Feedback</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}

export default FeedbackForm;

import React, { useState, useEffect } from 'react';
import { useAuth } from 'src/contexts/AuthContext';
import Modal from 'src/components/Modal';
import './CulturalSessionsPage.css'; // Import the CSS file

function CulturalSessionsPage() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/cultural-sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch cultural sessions');
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentSession(null);
    setName('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
    setShowModal(true);
  };

  const handleEdit = (session) => {
    setIsEditing(true);
    setCurrentSession(session);
    setName(session.name);
    setDescription(session.description);
    setDate(session.date);
    setTime(session.time);
    setLocation(session.location);
    setShowModal(true);
  };

  const handleDelete = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this cultural session?')) {
      try {
        const token = localStorage.getItem('accessToken');
        await fetch(`http://127.0.0.1:8000/api/v1/admin/cultural-sessions/${sessionId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchSessions();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || !date.trim() || !time.trim() || !location.trim()) {
      setError('All fields are required.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    const url = isEditing 
      ? `http://127.0.0.1:8000/api/v1/admin/cultural-sessions/${currentSession.id}` 
      : 'http://127.0.0.1:8000/api/v1/admin/cultural-sessions';
    const method = isEditing ? 'PUT' : 'POST';
    const body = JSON.stringify({ name, description, date, time, location });

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save cultural session');
      }
      setShowModal(false);
      setError(''); // Clear any previous errors
      fetchSessions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleParticipate = async (sessionId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://127.0.0.1:8000/api/v1/users/cultural-sessions/participate/${sessionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to participate in session');
      }
      alert('Successfully joined session!');
      fetchSessions(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(''); // Clear errors when closing modal
    // Reset form fields
    setName('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
  };

  if (loading) return <div className="cultural-sessions-container">Loading...</div>;

  return (
    <div className="cultural-sessions-container">
      <h2>Cultural Sessions</h2>
      {error && <div className="error">Error: {error}</div>}

      {currentUser && currentUser.role === 'admin' && (
        <button onClick={handleAdd}>Add Cultural Session</button>
      )}
      
      {sessions.length === 0 ? (
        <p>No cultural sessions available.</p>
      ) : (
        <table className="session-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Date</th>
              <th>Time</th>
              <th>Location</th>
              <th>Participants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session.id}>
                <td>{session.name}</td>
                <td>{session.description}</td>
                <td>{session.date}</td>
                <td>{session.time}</td>
                <td>{session.location}</td>
                <td>{session.participants ? session.participants.length : 0}</td>
                <td>
                  {currentUser && currentUser.role === 'admin' ? (
                    <>
                      <button className="edit-btn" onClick={() => handleEdit(session)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete(session.id)}>Delete</button>
                    </>
                  ) : (
                    <button 
                      className="participate-btn"
                      onClick={() => handleParticipate(session.id)} 
                      disabled={session.participants && session.participants.includes(currentUser.email)}
                    >
                      {session.participants && session.participants.includes(currentUser.email) ? 'Participating' : 'Participate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal show={showModal} onClose={handleCloseModal}>
        <form onSubmit={handleSubmit}>
          <h3>{isEditing ? 'Edit' : 'Add'} Cultural Session</h3>
          {error && <div className="error">Error: {error}</div>}
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required></textarea>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" required />
          <button type="submit">{isEditing ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default CulturalSessionsPage;

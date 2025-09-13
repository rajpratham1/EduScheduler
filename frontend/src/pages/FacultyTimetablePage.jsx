import React, { useState, useEffect } from 'react';
import { useAuth } from 'src/contexts/AuthContext.jsx';
import FeedbackForm from 'src/components/FeedbackForm.jsx';

const allTimeSlots = [
  "Mon_9-10", "Mon_10-11", "Mon_11-12",
  "Tue_9-10", "Tue_10-11", "Tue_11-12",
  "Wed_9-10", "Wed_10-11", "Wed_11-12",
  "Thu_9-10", "Thu_10-11", "Thu_11-12",
  "Fri_9-10", "Fri_10-11", "Fri_11-12",
];

function FacultyTimetablePage() {
  const { currentUser } = useAuth();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unavailableSlots, setUnavailableSlots] = useState([]);

  const fetchTimetableAndProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      // Fetch timetable
      const timetableResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/me/timetable', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!timetableResponse.ok) throw new Error('Failed to fetch timetable');
      const timetableData = await timetableResponse.json();
      setTimetable(timetableData);

      // Fetch user profile for unavailable slots
      const profileResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileResponse.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileResponse.json();
      setUnavailableSlots(profileData.unavailable_slots || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTimetableAndProfile();
    }
  }, [currentUser]);

  const handleSlotToggle = (slot) => {
    setUnavailableSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const handleSaveAvailability = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/me/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(unavailableSlots),
      });
      if (!response.ok) throw new Error('Failed to save availability');
      alert('Availability saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>My Timetable (Faculty)</h2>
      {timetable && timetable.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {timetable.map(tt => (
              <tr key={tt.id}>
                <td>{tt.name}</td>
                <td>{JSON.stringify(tt.data)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No timetable available.</p>
      )}

      <h3>Manage Availability</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
        {allTimeSlots.map(slot => (
          <button
            key={slot}
            onClick={() => handleSlotToggle(slot)}
            style={{
              backgroundColor: unavailableSlots.includes(slot) ? '#e74c3c' : '#2ecc71',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {slot}
          </button>
        ))}
      </div>
      <button onClick={handleSaveAvailability} style={{ marginTop: '20px' }}>Save Availability</button>

      <FeedbackForm />
    </div>
  );
}

export default FacultyTimetablePage;
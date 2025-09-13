import React, { useState, useEffect } from 'react';
import { useAuth } from 'src/contexts/AuthContext.jsx';
import FeedbackForm from 'src/components/FeedbackForm.jsx';
import { Link } from 'react-router-dom';

function StudentTimetablePage() {
  const { currentUser } = useAuth();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const token = localStorage.getItem('accessToken');
                const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/me/timetable', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch timetable');
        const data = await response.json();
        setTimetable(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchTimetable();
    }
  }, [currentUser]);

  if (loading) return <div>Loading timetable...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>My Timetable (Student)</h2>
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

      <h3>Enroll in Sessions</h3>
      <nav>
        <ul>
          <li><Link to="/dashboard/electives">Electives</Link></li>
          <li><Link to="/dashboard/cultural-sessions">Cultural Sessions</Link></li>
        </ul>
      </nav>

      <FeedbackForm />
    </div>
  );
}

export default StudentTimetablePage;

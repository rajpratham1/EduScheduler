import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

function StudentDashboard() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [feedbackLink, setFeedbackLink] = useState('');
  const [seatingPlan, setSeatingPlan] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch current student user details
      const userResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/me', { headers });
      if (!userResponse.ok) throw new Error('Failed to fetch student details');
      const userData = await userResponse.json();
      setStudentData(userData);

      // Fetch feedback link
      const feedbackResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/feedback-link', { headers });
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedbackLink(feedbackData.google_form_link);
      }

      // Fetch seating plan if assigned
      if (userData.classroom_id && userData.batch_id) {
        try {
          const seatingPlanResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/seating-plan/${userData.classroom_id}/${userData.batch_id}`, { headers });
          if (seatingPlanResponse.ok) {
            const seatingPlanData = await seatingPlanResponse.json();
            setSeatingPlan(seatingPlanData.plan);
          } else {
            console.warn(`Could not fetch seating plan for ${userData.classroom_id}, ${userData.batch_id}`);
          }
        } catch (spError) {
          console.error(`Error fetching seating plan:`, spError);
        }
      }

      // Fetch personalized timetable
      const timetableResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/me/timetable', { headers });
      if (timetableResponse.ok) {
        const timetableData = await timetableResponse.json();
        // Assuming timetableData is an array of timetable objects, and we want the first one or a specific one
        if (timetableData.length > 0) {
          setTimetable(timetableData[0].data.timetable); // Assuming data.timetable holds the actual schedule array
        }
      } else {
        console.warn('Failed to fetch timetable.');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleDownloadTimetablePdf = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/me/timetable/download', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to download timetable PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_timetable_${studentData.email}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadSeatingPlanPdf = async () => {
    try {
      if (!studentData.classroom_id || !studentData.batch_id) {
        throw new Error('Seating plan not assigned.');
      }
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/me/seating-plan/download?classroom_id=${studentData.classroom_id}&batch_id=${studentData.batch_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to download seating plan PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_seating_plan_${studentData.email}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="student-dashboard-container">Loading Student Dashboard...</div>;
  if (error) return <div className="student-dashboard-container error">Error: {error}</div>;
  if (!studentData) return <div className="student-dashboard-container">No student data found.</div>;

  return (
    <div className="student-dashboard-container">
      <h1>Welcome, {studentData.display_name || studentData.email}!</h1>
      <p>Role: {studentData.role}</p>
      {studentData.student_id && <p>Student ID: {studentData.student_id}</p>}
      {studentData.course_id && <p>Course: {studentData.course_id}</p>}
      {studentData.batch_id && <p>Batch: {studentData.batch_id}</p>}

      <section className="section-card">
        <h2>Your Classroom & Seat</h2>
        {studentData.classroom_id ? (
          <p>Classroom: {studentData.classroom_id} | Seat Number: {studentData.seat_number || 'N/A'}</p>
        ) : (
          <p>Classroom and seat assignment not yet available.</p>
        )}
        {seatingPlan && studentData.seat_number && (
          <div className="seating-plan-display">
            <h4>Your Seating Plan:</h4>
            <div className="seating-grid">
              {Object.entries(seatingPlan).map(([seat, studentEmail]) => (
                <div key={seat} className="seat-item" style={{ backgroundColor: seat === studentData.seat_number ? '#d4edda' : '#e9ecef' }}>
                  <strong>{seat}:</strong> {studentEmail}
                </div>
              ))}
            </div>
            <button onClick={handleDownloadSeatingPlanPdf}>Download Seating Plan PDF</button>
          </div>
        )}
      </section>

      <section className="section-card">
        <h2>Your Timetable</h2>
        {timetable ? (
          <div className="timetable-display">
            <h4>Current Schedule:</h4>
            <div className="timetable-grid">
              {timetable.map((item, index) => (
                <div key={index} className="timetable-item">
                  <p><strong>Subject:</strong> {item.subject}</p>
                  <p><strong>Faculty:</strong> {item.faculty}</p>
                  <p><strong>Classroom:</strong> {item.classroom}</p>
                  <p><strong>Time:</strong> {item.time_slot}</p>
                </div>
              ))}
            </div>
            <button onClick={handleDownloadTimetablePdf}>Download Timetable PDF</button>
          </div>
        ) : (
          <p>Timetable not yet available.</p>
        )}
      </section>

      <section className="section-card">
        <h2>Feedback</h2>
        {feedbackLink ? (
          <button className="feedback-link-btn" onClick={() => window.open(feedbackLink, '_blank')}>
            Submit Feedback via Google Form
          </button>
        ) : (
          <p>Feedback form link not available yet.</p>
        )}
      </section>
    </div>
  );
}

export default StudentDashboard;

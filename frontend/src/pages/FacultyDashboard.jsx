import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FacultyDashboard.css';

function FacultyDashboard() {
  const navigate = useNavigate();
  const [facultyData, setFacultyData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [feedbackLink, setFeedbackLink] = useState('');
  const [seatingPlans, setSeatingPlans] = useState({}); // { 'classroom_batch_id': plan_data }
  const [timetable, setTimetable] = useState(null); // State for faculty's timetable
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch current faculty user details
      const userResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/me', { headers });
      if (!userResponse.ok) throw new Error('Failed to fetch faculty details');
      const userData = await userResponse.json();
      setFacultyData(userData);

      // Fetch all assignments (and filter on frontend for now)
      const assignmentsResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/assignments', { headers });
      if (!assignmentsResponse.ok) throw new Error('Failed to fetch assignments');
      const allAssignments = await assignmentsResponse.json();
      
      // Filter assignments relevant to this faculty
      const facultyAssignments = allAssignments.filter(assign => assign.faculty_id === userData.email); // Assuming faculty_id is email
      setAssignments(facultyAssignments);

      // Fetch feedback link
      const feedbackResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/feedback-link', { headers });
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedbackLink(feedbackData.google_form_link);
      }

      // Fetch seating plans for assigned classes
      const fetchedSeatingPlans = {};
      for (const assign of facultyAssignments) {
        const planId = `${assign.classroom_id}_${assign.batch_id}`;
        if (!fetchedSeatingPlans[planId]) { // Fetch only once per classroom-batch combo
          try {
            const seatingPlanResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/seating-plan/${assign.classroom_id}/${assign.batch_id}`, { headers });
            if (seatingPlanResponse.ok) {
              const seatingPlanData = await seatingPlanResponse.json();
              fetchedSeatingPlans[planId] = seatingPlanData.plan;
            } else {
              console.warn(`Could not fetch seating plan for ${assign.classroom_id}, ${assign.batch_id}`);
            }
          } catch (spError) {
            console.error(`Error fetching seating plan for ${assign.classroom_id}, ${assign.batch_id}:`, spError);
          }
        }
      }
      setSeatingPlans(fetchedSeatingPlans);

      // Fetch faculty's timetable
      const timetableResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/me/timetable', { headers });
      if (timetableResponse.ok) {
        const timetableData = await timetableResponse.json();
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
    fetchFacultyData();
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
      a.download = `my_timetable_${facultyData.email}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadSeatingPlanPdf = async (classroom_id, batch_id) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/me/seating-plan/download?classroom_id=${classroom_id}&batch_id=${batch_id}`, {
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
      a.download = `seating_plan_${classroom_id}_${batch_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="faculty-dashboard-container">Loading Faculty Dashboard...</div>;
  if (error) return <div className="faculty-dashboard-container error">Error: {error}</div>;
  if (!facultyData) return <div className="faculty-dashboard-container">No faculty data found.</div>;

  return (
    <div className="faculty-dashboard-container">
      <h1>Welcome, {facultyData.display_name || facultyData.email}!</h1>
      <p>Role: {facultyData.role}</p>
      {facultyData.department && <p>Department: {facultyData.department}</p>}

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
        <h2>Your Assigned Classes & Seating Plans</h2>
        {assignments.length === 0 ? (
          <p>No classes assigned yet.</p>
        ) : (
          <div>
            {assignments.map(assign => (
              <div key={assign.id} className="assignment-item">
                <p><strong>Subject:</strong> {assign.subject_id}</p>
                <p><strong>Batch:</strong> {assign.batch_id}</p>
                <p><strong>Classroom:</strong> {assign.classroom_id}</p>
                <p><strong>Time:</strong> {assign.day_of_week}, {assign.time_slot}</p>
                
                {seatingPlans[`${assign.classroom_id}_${assign.batch_id}`] && (
                  <div className="seating-plan-display">
                    <h4>Seating Plan for this Class:</h4>
                    <div className="seating-grid">
                      {Object.entries(seatingPlans[`${assign.classroom_id}_${assign.batch_id}`]).map(([seat, studentEmail]) => (
                        <div key={seat} className="seat-item">
                          <strong>{seat}:</strong> {studentEmail}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => handleDownloadSeatingPlanPdf(assign.classroom_id, assign.batch_id)}>Download Seating Plan PDF</button>
                  </div>
                )}
              </div>
            ))}
          </div>
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

export default FacultyDashboard;

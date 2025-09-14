import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FacultyDashboard.css';

function FacultyDashboard() {
  const navigate = useNavigate();
  const [facultyData, setFacultyData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [feedbackLink, setFeedbackLink] = useState('');
  const [seatingPlans, setSeatingPlans] = useState({}); // { 'classroom_batch_id': plan_data }
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

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  if (loading) return <div className="faculty-dashboard-container">Loading Faculty Dashboard...</div>;
  if (error) return <div className="faculty-dashboard-container error">Error: {error}</div>;
  if (!facultyData) return <div className="faculty-dashboard-container">No faculty data found.</div>;

  return (
    <div className="faculty-dashboard-container">
      <h1>Welcome, {facultyData.display_name || facultyData.email}!</h1>
      <p>Role: {facultyData.role}</p>
      {facultyData.department && <p>Department: {facultyData.department}</p>}

      <section className="section-card">
        <h2>Your Assigned Classes</h2>
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
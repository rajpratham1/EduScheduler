import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';

function AdminDashboard() {
  const { currentUser } = useAuth();
  const [coursesToScheduleInput, setCoursesToScheduleInput] = useState(
    JSON.stringify([
      {"subject_id": "math101", "batch_id": "batchA", "duration": 1, "required_faculty_id": null, "is_lab": false, "num_classes": 2},
      {"subject_id": "phy201", "batch_id": "batchA", "duration": 1, "required_faculty_id": "fac1", "is_lab": true, "num_classes": 1},
    ], null, 2)
  );
  const [timeSlotsInput, setTimeSlotsInput] = useState(
    JSON.stringify([
      "Mon_9-10", "Mon_10-11", "Mon_11-12",
      "Tue_9-10", "Tue_10-11", "Tue_11-12",
      "Wed_9-10", "Wed_10-11", "Wed_11-12",
      "Thu_9-10", "Thu_10-11", "Thu_11-12",
      "Fri_9-10", "Fri_10-11", "Fri_11-12",
    ], null, 2)
  );
  const [constraintsInput, setConstraintsInput] = useState(
    JSON.stringify({"max_classes_per_day": 4}, null, 2)
  );
  const [generatedTimetableOutput, setGeneratedTimetableOutput] = useState('');
  const [loadingGeneration, setLoadingGeneration] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const handleGenerateTimetable = async () => {
    setLoadingGeneration(true);
    setGenerationError('');
    setGeneratedTimetableOutput('');

    try {
      const token = localStorage.getItem('accessToken');
      const courses = JSON.parse(coursesToScheduleInput);
      const timeSlots = JSON.parse(timeSlotsInput);
      const constraints = JSON.parse(constraintsInput);

      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/schedule/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courses_to_schedule: courses,
          time_slots: timeSlots,
          constraints: constraints,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate timetable');
      }

      const data = await response.json();
      setGeneratedTimetableOutput(JSON.stringify(data, null, 2));

    } catch (err) {
      setGenerationError(err.message);
    } finally {
      setLoadingGeneration(false);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return <p>You do not have permission to view this page.</p>;
  }

  return (
    <div className="admin-dashboard-container">
      <h1>Admin Dashboard</h1>
      <nav>
        <ul>
          <li><Link to="/dashboard/admin/faculty">Manage Faculty</Link></li>
          <li><Link to="/dashboard/admin/students">Manage Students</Link></li>
          <li><Link to="/dashboard/admin/subjects">Manage Subjects</Link></li>
          <li><Link to="/dashboard/admin/classrooms">Manage Classrooms</Link></li>
          <li><Link to="/dashboard/admin/timetables">Manage Timetables</Link></li>
          <li><Link to="/dashboard/admin/users">Manage Users</Link></li>
        </ul>
      </nav>
      <hr />

      <section className="timetable-generation-section">
        <h2>Timetable Generation</h2>
        {generationError && <div className="error">Error: {generationError}</div>}

        <div className="input-group">
          <label htmlFor="coursesToSchedule">Courses to Schedule (JSON):</label>
          <textarea
            id="coursesToSchedule"
            value={coursesToScheduleInput}
            onChange={(e) => setCoursesToScheduleInput(e.target.value)}
            rows="8"
            cols="80"
          ></textarea>
        </div>

        <div className="input-group">
          <label htmlFor="timeSlots">Time Slots (JSON Array):</label>
          <textarea
            id="timeSlots"
            value={timeSlotsInput}
            onChange={(e) => setTimeSlotsInput(e.target.value)}
            rows="5"
            cols="80"
          ></textarea>
        </div>

        <div className="input-group">
          <label htmlFor="constraints">Additional Constraints (JSON Object):</label>
          <textarea
            id="constraints"
            value={constraintsInput}
            onChange={(e) => setConstraintsInput(e.target.value)}
            rows="5"
            cols="80"
          ></textarea>
        </div>

        <button onClick={handleGenerateTimetable} disabled={loadingGeneration}>
          {loadingGeneration ? 'Generating...' : 'Generate Timetable'}
        </button>

        {generatedTimetableOutput && (
          <div className="output-group">
            <h3>Generated Timetable:</h3>
            <pre>{generatedTimetableOutput}</pre>
          </div>
        )}
      </section>

      <Outlet />
    </div>
  );
}

export default AdminDashboard;

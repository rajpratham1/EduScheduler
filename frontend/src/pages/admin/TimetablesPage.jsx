import React, { useState, useEffect } from 'react';
import Modal from 'src/components/Modal';
import { useAuth } from 'src/contexts/AuthContext';
import './TimetablesPage.css';

function TimetablesPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Data for dropdowns
  const [allCourses, setAllCourses] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [allClassrooms, setAllClassrooms] = useState([]);

  // Timetable generation request states
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState([]);
  const [maxClassesPerDay, setMaxClassesPerDay] = useState('');
  // Fixed slots, leaves, electives can be added later as more complex inputs

  // Generated timetable display states
  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [timetableName, setTimetableName] = useState('');

  const fetchAllDataForGeneration = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const coursesResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/courses', { headers });
      const coursesData = await coursesResponse.json();
      setAllCourses(coursesData);

      const batchesData = [];
      for (const course of coursesData) {
        const batchRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/courses/${course.id}/batches`, { headers });
        if (batchRes.ok) { batchesData.push(...await batchRes.json()); }
      }
      setAllBatches(batchesData);

      const subjectsResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/subjects', { headers });
      setAllSubjects(await subjectsResponse.json());

      const facultyResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/faculty', { headers });
      setAllFaculty(await facultyResponse.json());

      const classroomsResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/classrooms', { headers });
      setAllClassrooms(await classroomsResponse.json());

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchAllDataForGeneration();
    }
  }, [currentUser]);

  const handleGenerateTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      setGeneratedTimetable(null);

      const token = localStorage.getItem('accessToken');
      const requestBody = {
        selected_batches: selectedBatches,
        selected_subjects: selectedSubjects,
        selected_faculty: selectedFaculty,
        selected_classrooms: selectedClassrooms,
        max_classes_per_day: maxClassesPerDay ? parseInt(maxClassesPerDay) : undefined,
        // fixed_slots, leaves, electives can be added here
      };

      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate timetable');
      }

      const data = await response.json();
      setGeneratedTimetable(data.timetable);
      setMessage(data.message || 'Timetable generated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneratedTimetable = async () => {
    if (!generatedTimetable) {
      setError('No timetable generated to save.');
      return;
    }
    if (!timetableName.trim()) {
      setError('Please provide a name for the timetable.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');
      const token = localStorage.getItem('accessToken');
      const timetableData = {
        name: timetableName,
        data: { timetable: generatedTimetable }, // Store the generated timetable
      };

      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/timetables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(timetableData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save generated timetable');
      }
      setMessage('Generated timetable saved successfully!');
      setGeneratedTimetable(null);
      setTimetableName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="timetables-container">Loading Timetable Generator...</div>;
  if (error) return <div className="timetables-container error">Error: {error}</div>;

  return (
    <div className="timetables-container">
      <h1>AI Timetable Generator</h1>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}

      <section className="generation-controls">
        <h2>Select Constraints</h2>
        <div className="control-group">
          <label>Batches:</label>
          <select multiple value={selectedBatches} onChange={e => setSelectedBatches(Array.from(e.target.selectedOptions, option => option.value))}>
            {allBatches.map(batch => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>Subjects:</label>
          <select multiple value={selectedSubjects} onChange={e => setSelectedSubjects(Array.from(e.target.selectedOptions, option => option.value))}>
            {allSubjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>Faculty:</label>
          <select multiple value={selectedFaculty} onChange={e => setSelectedFaculty(Array.from(e.target.selectedOptions, option => option.value))}>
            {allFaculty.map(facultyMember => <option key={facultyMember.id} value={facultyMember.id}>{facultyMember.name}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>Classrooms:</label>
          <select multiple value={selectedClassrooms} onChange={e => setSelectedClassrooms(Array.from(e.target.selectedOptions, option => option.value))}>
            {allClassrooms.map(classroom => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>Max Classes Per Day (Optional):</label>
          <input type="number" value={maxClassesPerDay} onChange={e => setMaxClassesPerDay(e.target.value)} placeholder="e.g., 5" />
        </div>
        <button onClick={handleGenerateTimetable} disabled={selectedBatches.length === 0 || selectedSubjects.length === 0}>Generate Timetable</button>
      </section>

      {generatedTimetable && (
        <section className="generated-timetable-display">
          <h2>Generated Timetable</h2>
          <div className="timetable-preview">
            {generatedTimetable.length === 0 ? (
              <p>No timetable could be generated with the given constraints.</p>
            ) : (
              <table className="generated-timetable-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Batch</th>
                    <th>Faculty</th>
                    <th>Classroom</th>
                    <th>Time Slot</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedTimetable.map((item, index) => (
                    <tr key={index}>
                      <td>{item.subject}</td>
                      <td>{item.batch}</td>
                      <td>{item.faculty}</td>
                      <td>{item.classroom}</td>
                      <td>{item.time_slot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="save-timetable-section">
            <input type="text" value={timetableName} onChange={e => setTimetableName(e.target.value)} placeholder="Name this timetable to save" />
            <button onClick={handleSaveGeneratedTimetable} disabled={!timetableName.trim()}>Save Generated Timetable</button>
          </div>
        </section>
      )}
    </div>
  );
}

export default TimetablesPage;
import React, { useState, useEffect } from 'react';
import Modal from 'src/components/Modal';
import './AssignmentsPage.css';

function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Data for dropdowns
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'];

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch assignments
      const assignmentsResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/assignments', { headers });
      if (!assignmentsResponse.ok) throw new Error('Failed to fetch assignments');
      const assignmentsData = await assignmentsResponse.json();
      setAssignments(assignmentsData);

      // Fetch courses
      const coursesResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/courses', { headers });
      if (!coursesResponse.ok) throw new Error('Failed to fetch courses');
      const coursesData = await coursesResponse.json();
      setCourses(coursesData);

      // Fetch all batches (will filter by course later)
      const allBatches = [];
      for (const course of coursesData) {
        const batchesResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/courses/${course.id}/batches`, { headers });
        if (batchesResponse.ok) {
          const batchesData = await batchesResponse.json();
          allBatches.push(...batchesData);
        }
      }
      setBatches(allBatches);

      // Fetch subjects
      const subjectsResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/subjects', { headers });
      if (!subjectsResponse.ok) throw new Error('Failed to fetch subjects');
      const subjectsData = await subjectsResponse.json();
      setSubjects(subjectsData);

      // Fetch faculty
      const facultyResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/faculty', { headers });
      if (!facultyResponse.ok) throw new Error('Failed to fetch faculty');
      const facultyData = await facultyResponse.json();
      setFaculty(facultyData);

      // Fetch classrooms
      const classroomsResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/classrooms', { headers });
      if (!classroomsResponse.ok) throw new Error('Failed to fetch classrooms');
      const classroomsData = await classroomsResponse.json();
      setClassrooms(classroomsData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentAssignment(null);
    setSelectedCourseId('');
    setSelectedBatchId('');
    setSelectedSubjectId('');
    setSelectedFacultyId('');
    setSelectedClassroomId('');
    setSelectedDay('');
    setSelectedTime('');
    setShowModal(true);
  };

  const handleEdit = (assignment) => {
    setIsEditing(true);
    setCurrentAssignment(assignment);
    setSelectedCourseId(assignment.course_id);
    setSelectedBatchId(assignment.batch_id);
    setSelectedSubjectId(assignment.subject_id);
    setSelectedFacultyId(assignment.faculty_id);
    setSelectedClassroomId(assignment.classroom_id);
    setSelectedDay(assignment.day_of_week);
    setSelectedTime(assignment.time_slot);
    setShowModal(true);
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/assignments/${assignmentId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Failed to delete assignment');
        }
        setMessage('Assignment deleted successfully.');
        fetchAllData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = isEditing
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/assignments/${currentAssignment.id}`
      : import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/assignments';
    const method = isEditing ? 'PUT' : 'POST';
    const body = JSON.stringify({
      batch_id: selectedBatchId,
      course_id: selectedCourseId,
      subject_id: selectedSubjectId,
      faculty_id: selectedFacultyId,
      classroom_id: selectedClassroomId,
      day_of_week: selectedDay,
      time_slot: selectedTime,
    });

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save assignment');
      }
      setShowModal(false);
      setMessage(isEditing ? 'Assignment updated successfully.' : 'Assignment created successfully.');
      fetchAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getCourseName = (id) => courses.find(c => c.id === id)?.name || id;
  const getBatchName = (id) => batches.find(b => b.id === id)?.name || id;
  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || id;
  const getFacultyName = (id) => faculty.find(f => f.id === id)?.name || id;
  const getClassroomName = (id) => classrooms.find(c => c.id === id)?.name || id;

  const filteredBatches = batches.filter(batch => batch.course_id === selectedCourseId);

  if (loading) return <div className="assignments-container">Loading...</div>;

  return (
    <div className="assignments-container">
      <h1 className="page-title">Manage Class Assignments</h1>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
      <button onClick={handleAdd}>Add New Assignment</button>

      {assignments.length === 0 ? (
        <p>No class assignments found.</p>
      ) : (
        <table className="assignment-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Batch</th>
              <th>Subject</th>
              <th>Faculty</th>
              <th>Classroom</th>
              <th>Day</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id}>
                <td>{getCourseName(a.course_id)}</td>
                <td>{getBatchName(a.batch_id)}</td>
                <td>{getSubjectName(a.subject_id)}</td>
                <td>{getFacultyName(a.faculty_id)}</td>
                <td>{getClassroomName(a.classroom_id)}</td>
                <td>{a.day_of_week}</td>
                <td>{a.time_slot}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(a)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(a.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <h3>{isEditing ? 'Edit' : 'Add'} Class Assignment</h3>
          {error && <div className="error">{error}</div>}

          <label>
            Course:
            <select value={selectedCourseId} onChange={e => {
              setSelectedCourseId(e.target.value);
              setSelectedBatchId(''); // Reset batch when course changes
            }} required>
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label>
            Batch:
            <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} required disabled={!selectedCourseId}>
              <option value="">Select Batch</option>
              {filteredBatches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>

          <label>
            Subject:
            <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} required>
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          <label>
            Faculty:
            <select value={selectedFacultyId} onChange={e => setSelectedFacultyId(e.target.value)} required>
              <option value="">Select Faculty</option>
              {faculty.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label>

          <label>
            Classroom:
            <select value={selectedClassroomId} onChange={e => setSelectedClassroomId(e.target.value)} required>
              <option value="">Select Classroom</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label>
            Day of Week:
            <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} required>
              <option value="">Select Day</option>
              {daysOfWeek.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </label>

          <label>
            Time Slot:
            <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} required>
              <option value="">Select Time Slot</option>
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </label>

          <button type="submit">{isEditing ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default AssignmentsPage;

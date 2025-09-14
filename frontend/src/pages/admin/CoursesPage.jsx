import React, { useState, useEffect } from 'react';
import Modal from 'src/components/Modal';
import './CoursesPage.css';

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Course form states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  // Batch form states
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [batchName, setBatchName] = useState('');
  const [batchYear, setBatchYear] = useState(0);
  const [selectedCourseIdForBatch, setSelectedCourseIdForBatch] = useState(null); // To link batch to course

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const token = localStorage.getItem('accessToken');
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to fetch courses');
      }
      const coursesData = await response.json();

      // Fetch batches for each course
      const coursesWithBatches = await Promise.all(coursesData.map(async (course) => {
        const batchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/courses/${course.id}/batches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!batchResponse.ok) {
          const errData = await batchResponse.json();
          console.error(`Failed to fetch batches for course ${course.name}:`, errData.detail);
          return { ...course, batches: [] };
        }
        const batchesData = await batchResponse.json();
        return { ...course, batches: batchesData };
      }));
      setClassrooms(coursesWithBatches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // --- Course Handlers ---
  const handleAddCourse = () => {
    setIsEditingCourse(false);
    setCurrentCourse(null);
    setCourseName('');
    setCourseCode('');
    setCourseDescription('');
    setShowCourseModal(true);
  };

  const handleEditCourse = (course) => {
    setIsEditingCourse(true);
    setCurrentCourse(course);
    setCourseName(course.name);
    setCourseCode(course.code);
    setCourseDescription(course.description || '');
    setShowCourseModal(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course and all its batches?')) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/courses/${courseId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Failed to delete course');
        }
        setMessage('Course deleted successfully.');
        fetchCourses();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = isEditingCourse
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/courses/${currentCourse.id}`
      : import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/courses';
    const method = isEditingCourse ? 'PUT' : 'POST';
    const body = JSON.stringify({ name: courseName, code: courseCode, description: courseDescription });

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save course');
      }
      setShowCourseModal(false);
      setMessage(isEditingCourse ? 'Course updated successfully.' : 'Course created successfully.');
      fetchCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Batch Handlers ---
  const handleAddBatch = (courseId) => {
    setIsEditingBatch(false);
    setCurrentBatch(null);
    setBatchName('');
    setBatchYear(0);
    setSelectedCourseIdForBatch(courseId);
    setShowBatchModal(true);
  };

  const handleEditBatch = (batch) => {
    setIsEditingBatch(true);
    setCurrentBatch(batch);
    setBatchName(batch.name);
    setBatchYear(batch.year);
    setSelectedCourseIdForBatch(batch.course_id);
    setShowBatchModal(true);
  };

  const handleDeleteBatch = async (courseId, batchId) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/courses/${courseId}/batches/${batchId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Failed to delete batch');
        }
        setMessage('Batch deleted successfully.');
        fetchCourses();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = isEditingBatch
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/courses/${selectedCourseIdForBatch}/batches/${currentBatch.id}`
      : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/courses/${selectedCourseIdForBatch}/batches`;
    const method = isEditingBatch ? 'PUT' : 'POST';
    const body = JSON.stringify({ name: batchName, year: batchYear, course_id: selectedCourseIdForBatch });

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save batch');
      }
      setShowBatchModal(false);
      setMessage(isEditingBatch ? 'Batch updated successfully.' : 'Batch created successfully.');
      fetchCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="courses-container">Loading...</div>;

  return (
    <div className="courses-container">
      <h1 className="page-title">Manage Courses & Batches</h1>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
      <button onClick={handleAddCourse}>Add New Course</button>

      {courses.length === 0 ? (
        <p>No courses found.</p>
      ) : (
        <table className="course-table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Code</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <React.Fragment key={c.id}>
                <tr>
                  <td>{c.name}</td>
                  <td>{c.code}</td>
                  <td>{c.description}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEditCourse(c)}>Edit Course</button>
                    <button className="delete-btn" onClick={() => handleDeleteCourse(c.id)}>Delete Course</button>
                    <button className="add-batch-btn" onClick={() => handleAddBatch(c.id)}>Add Batch</button>
                  </td>
                </tr>
                {c.batches && c.batches.length > 0 && (
                  <tr>
                    <td colSpan="4">
                      <div className="batches-list">
                        <h4>Batches for {c.name}:</h4>
                        <table className="batch-table">
                          <thead>
                            <tr>
                              <th>Batch Name</th>
                              <th>Year</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.batches.map(batch => (
                              <tr key={batch.id}>
                                <td>{batch.name}</td>
                                <td>{batch.year}</td>
                                <td>
                                  <button className="edit-btn" onClick={() => handleEditBatch(batch)}>Edit Batch</button>
                                  <button className="delete-btn" onClick={() => handleDeleteBatch(c.id, batch.id)}>Delete Batch</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}

      {/* Course Modal */}
      <Modal show={showCourseModal} onClose={() => setShowCourseModal(false)}>
        <form onSubmit={handleCourseSubmit}>
          <h3>{isEditingCourse ? 'Edit' : 'Add'} Course</h3>
          {error && <div className="error">{error}</div>}
          <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Course Name" required />
          <input type="text" value={courseCode} onChange={e => setCourseCode(e.target.value)} placeholder="Course Code" required />
          <textarea value={courseDescription} onChange={e => setCourseDescription(e.target.value)} placeholder="Description"></textarea>
          <button type="submit">{isEditingCourse ? 'Update' : 'Create'}</button>
        </form>
      </Modal>

      {/* Batch Modal */}
      <Modal show={showBatchModal} onClose={() => setShowBatchModal(false)}>
        <form onSubmit={handleBatchSubmit}>
          <h3>{isEditingBatch ? 'Edit' : 'Add'} Batch for {courses.find(c => c.id === selectedCourseIdForBatch)?.name}</h3>
          {error && <div className="error">{error}</div>}
          <input type="text" value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="Batch Name (e.g., 2024-2028)" required />
          <input type="number" value={batchYear} onChange={e => setBatchYear(parseInt(e.target.value))} placeholder="Year (e.g., 1, 2, 3, 4)" required min="0"/>
          <button type="submit">{isEditingBatch ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default CoursesPage;
import React, { useState, useEffect } from 'react';
import Modal from 'src/components/Modal';
import './SubjectsPage.css'; // Import the CSS file

function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/subjects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch subjects');
      const data = await response.json();
      setSubjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentSubject(null);
    setName('');
    setCode('');
    setDepartment('');
    setShowModal(true);
  };

  const handleEdit = (subjectMember) => {
    setIsEditing(true);
    setCurrentSubject(subjectMember);
    setName(subjectMember.name);
    setCode(subjectMember.code);
    setDepartment(subjectMember.department);
    setShowModal(true);
  };

  const handleDelete = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        const token = localStorage.getItem('accessToken');
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/subjects/${subjectId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchSubjects();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Subject name cannot be empty.');
      return;
    }
    if (!code.trim()) {
      setError('Subject code cannot be empty.');
      return;
    }
    if (!department.trim()) {
      setError('Department cannot be empty.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    const url = isEditing
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/subjects/${currentSubject.id}`
      : import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/subjects';
    const method = isEditing ? 'PUT' : 'POST';
    const body = JSON.stringify({ name, code, department });

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
        throw new Error(errorData.detail || 'Failed to save subject');
      }
      setShowModal(false);
      setError(''); // Clear any previous errors
      fetchSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(''); // Clear errors when closing modal
    // Reset form fields
    setName('');
    setCode('');
    setDepartment('');
  };

  if (loading) return <div className="subjects-container">Loading...</div>;

  return (
    <div className="subjects-container">
      <h1 className="page-title">Manage Subjects</h1>
      {error && <div className="error">Error: {error}</div>}
      <button onClick={handleAdd}>Add Subject</button>

      {subjects.length === 0 ? (
        <p>No subjects found.</p>
      ) : (
        <table className="subject-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.code}</td>
                <td>{s.department}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(s)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal show={showModal} onClose={handleCloseModal}>
        <form onSubmit={handleSubmit}>
          <h3>{isEditing ? 'Edit' : 'Add'} Subject</h3>
          {error && <div className="error">Error: {error}</div>}
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
          <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Code" required />
          <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department" required />
          <button type="submit">{isEditing ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default SubjectsPage;
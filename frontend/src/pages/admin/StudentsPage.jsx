import React, { useState, useEffect } from 'react';
import Modal from 'src/components/Modal';
import './StudentsPage.css'; // Import the CSS file

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/students', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentStudent(null);
    setName('');
    setEmail('');
    setDepartment('');
    setBatch('');
    setShowModal(true);
  };

  const handleEdit = (studentMember) => {
    setIsEditing(true);
    setCurrentStudent(studentMember);
    setName(studentMember.name);
    setEmail(studentMember.email);
    setDepartment(studentMember.department);
    setBatch(studentMember.batch);
    setShowModal(true);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const token = localStorage.getItem('accessToken');
        await fetch(`http://127.0.0.1:8000/api/v1/admin/students/${studentId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchStudents();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Student name cannot be empty.');
      return;
    }
    if (!email.trim() || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!department.trim()) {
      setError('Department cannot be empty.');
      return;
    }
    if (!batch.trim()) {
      setError('Batch cannot be empty.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    const url = isEditing 
      ? `http://127.0.0.1:8000/api/v1/admin/students/${currentStudent.id}` 
      : 'http://127.0.0.1:8000/api/v1/admin/students';
    const method = isEditing ? 'PUT' : 'POST';
    const body = JSON.stringify({ name, email, department, batch });

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
        throw new Error(errorData.detail || 'Failed to save student');
      }
      setShowModal(false);
      setError(''); // Clear any previous errors
      fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(''); // Clear errors when closing modal
    // Reset form fields
    setName('');
    setEmail('');
    setDepartment('');
    setBatch('');
  };

  if (loading) return <div className="students-container">Loading...</div>;

  return (
    <div className="students-container">
      <h1 className="page-title">Manage Students</h1>
      {error && <div className="error">Error: {error}</div>}
      <button onClick={handleAdd}>Add Student</button>
      
      {students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <table className="student-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Batch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.department}</td>
                <td>{s.batch}</td>
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
          <h3>{isEditing ? 'Edit' : 'Add'} Student</h3>
          {error && <div className="error">Error: {error}</div>}
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
          <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department" required />
          <input type="text" value={batch} onChange={e => setBatch(e.target.value)} placeholder="Batch" required />
          <button type="submit">{isEditing ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default StudentsPage;

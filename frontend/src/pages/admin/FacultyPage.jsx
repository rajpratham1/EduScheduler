import React, { useState, useEffect } from 'react';
import Modal from 'src/components/Modal';
import './FacultyPage.css'; // Import the CSS file

function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/faculty', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch faculty');
      const data = await response.json();
      setFaculty(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentFaculty(null);
    setName('');
    setEmail('');
    setDepartment('');
    setShowModal(true);
  };

  const handleEdit = (facultyMember) => {
    setIsEditing(true);
    setCurrentFaculty(facultyMember);
    setName(facultyMember.name);
    setEmail(facultyMember.email);
    setDepartment(facultyMember.department);
    setShowModal(true);
  };

  const handleDelete = async (facultyId) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        const token = localStorage.getItem('accessToken');
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/faculty/${facultyId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchFaculty();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Faculty name cannot be empty.');
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

    const token = localStorage.getItem('accessToken');
    const url = isEditing
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/faculty/${currentFaculty.id}`
      : import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/faculty';
    const method = isEditing ? 'PUT' : 'POST';
    const body = JSON.stringify({ name, email, department });

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
        throw new Error(errorData.detail || 'Failed to save faculty member');
      }
      setShowModal(false);
      setError(''); // Clear any previous errors
      fetchFaculty();
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
  };

  if (loading) return <div className="faculty-container">Loading...</div>;

  return (
    <div className="faculty-container">
      <h1 className="page-title">Manage Faculty</h1>
      {error && <div className="error">Error: {error}</div>}
      <button onClick={handleAdd}>Add Faculty</button>

      {faculty.length === 0 ? (
        <p>No faculty members found.</p>
      ) : (
        <table className="faculty-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {faculty.map(f => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.email}</td>
                <td>{f.department}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(f)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(f.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal show={showModal} onClose={handleCloseModal}>
        <form onSubmit={handleSubmit}>
          <h3>{isEditing ? 'Edit' : 'Add'} Faculty</h3>
          {error && <div className="error">Error: {error}</div>}
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
          <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department" required />
          <button type="submit">{isEditing ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default FacultyPage;
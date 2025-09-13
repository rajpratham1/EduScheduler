import React, { useState, useEffect } from 'react';
import Modal from 'src/components/Modal';
import './ClassroomsPage.css'; // Import the CSS file

function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState(null);

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(0);
  const [resources, setResources] = useState('');

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/classrooms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch classrooms');
      const data = await response.json();
      setClassrooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentClassroom(null);
    setName('');
    setCapacity(0);
    setResources('');
    setShowModal(true);
  };

  const handleEdit = (classroom) => {
    setIsEditing(true);
    setCurrentClassroom(classroom);
    setName(classroom.name);
    setCapacity(classroom.capacity);
    setResources(classroom.resources.join(', '));
    setShowModal(true);
  };

  const handleDelete = async (classroomId) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        const token = localStorage.getItem('accessToken');
        await fetch(`http://127.0.0.1:8000/api/v1/admin/classrooms/${classroomId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchClassrooms();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Classroom name cannot be empty.');
      return;
    }
    if (capacity <= 0) {
      setError('Capacity must be a positive number.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    const url = isEditing 
      ? `http://127.0.0.1:8000/api/v1/admin/classrooms/${currentClassroom.id}` 
      : 'http://127.0.0.1:8000/api/v1/admin/classrooms';
    const method = isEditing ? 'PUT' : 'POST';
    const body = JSON.stringify({ name, capacity, resources: resources.split(',').map(r => r.trim()).filter(r => r) });

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
        throw new Error(errorData.detail || 'Failed to save classroom');
      }
      setShowModal(false);
      setError(''); // Clear any previous errors
      fetchClassrooms();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(''); // Clear errors when closing modal
    // Reset form fields
    setName('');
    setCapacity(0);
    setResources('');
  };

  if (loading) return <div className="classrooms-container">Loading...</div>;

  return (
    <div className="classrooms-container">
      <h1 className="page-title">Manage Classrooms</h1>
      {error && <div className="error">Error: {error}</div>}
      <button onClick={handleAdd}>Add Classroom</button>
      
      {classrooms.length === 0 ? (
        <p>No classrooms found.</p>
      ) : (
        <table className="classroom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Capacity</th>
              <th>Resources</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.capacity}</td>
                <td>{c.resources.join(', ')}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(c)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal show={showModal} onClose={handleCloseModal}>
        <form onSubmit={handleSubmit}>
          <h3>{isEditing ? 'Edit' : 'Add'} Classroom</h3>
          {error && <div className="error">Error: {error}</div>}
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
          <input type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} placeholder="Capacity" required min="1"/>
          <input type="text" value={resources} onChange={e => setResources(e.target.value)} placeholder="Resources (comma-separated)" />
          <button type="submit">{isEditing ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default ClassroomsPage;

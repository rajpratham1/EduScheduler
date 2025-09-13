import React, { useState, useEffect } from 'react';
import { useAuth } from 'src/contexts/AuthContext';
import Modal from 'src/components/Modal';
import './ElectivesPage.css'; // Import the CSS file

function ElectivesPage() {
  const { currentUser } = useAuth();
  const [electives, setElectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentElective, setCurrentElective] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(0);

  const fetchElectives = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/electives', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch electives');
      const data = await response.json();
      setElectives(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElectives();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentElective(null);
    setName('');
    setDescription('');
    setCapacity(0);
    setShowModal(true);
  };

  const handleEdit = (elective) => {
    setIsEditing(true);
    setCurrentElective(elective);
    setName(elective.name);
    setDescription(elective.description);
    setCapacity(elective.capacity);
    setShowModal(true);
  };

  const handleDelete = async (electiveId) => {
    if (window.confirm('Are you sure you want to delete this elective?')) {
      try {
        const token = localStorage.getItem('accessToken');
        await fetch(`http://127.0.0.1:8000/api/v1/admin/electives/${electiveId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchElectives();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      setError('Name and description are required.');
      return;
    }
    if (capacity <= 0) {
      setError('Capacity must be a positive number.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    const url = isEditing 
      ? `http://127.0.0.1:8000/api/v1/admin/electives/${currentElective.id}` 
      : 'http://127.0.0.1:8000/api/v1/admin/electives';
    const method = isEditing ? 'PUT' : 'POST';
    const body = JSON.stringify({ name, description, capacity });

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
        throw new Error(errorData.detail || 'Failed to save elective');
      }
      setShowModal(false);
      setError(''); // Clear any previous errors
      fetchElectives();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEnroll = async (electiveId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://127.0.0.1:8000/api/v1/users/electives/enroll/${electiveId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to enroll in elective');
      }
      alert('Enrolled successfully!');
      fetchElectives(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(''); // Clear errors when closing modal
    // Reset form fields
    setName('');
    setDescription('');
    setCapacity(0);
  };

  if (loading) return <div className="electives-container">Loading...</div>;

  return (
    <div className="electives-container">
      <h2>Available Electives</h2>
      {error && <div className="error">Error: {error}</div>}

      {currentUser && currentUser.role === 'admin' && (
        <button onClick={handleAdd}>Add Elective</button>
      )}
      
      {electives.length === 0 ? (
        <p>No electives available.</p>
      ) : (
        <table className="elective-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Capacity</th>
              <th>Enrolled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {electives.map(elective => (
              <tr key={elective.id}>
                <td>{elective.name}</td>
                <td>{elective.description}</td>
                <td>{elective.capacity}</td>
                <td>{elective.enrolled_students ? elective.enrolled_students.length : 0}</td>
                <td>
                  {currentUser && currentUser.role === 'admin' ? (
                    <>
                      <button className="edit-btn" onClick={() => handleEdit(elective)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete(elective.id)}>Delete</button>
                    </>
                  ) : (
                    <button 
                      className="enroll-btn"
                      onClick={() => handleEnroll(elective.id)} 
                      disabled={elective.enrolled_students && (elective.enrolled_students.includes(currentUser.email) || elective.enrolled_students.length >= elective.capacity)}
                    >
                      {elective.enrolled_students && elective.enrolled_students.includes(currentUser.email) ? 'Enrolled' : 'Enroll'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal show={showModal} onClose={handleCloseModal}>
        <form onSubmit={handleSubmit}>
          <h3>{isEditing ? 'Edit' : 'Add'} Elective</h3>
          {error && <div className="error">Error: {error}</div>}
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required></textarea>
          <input type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} placeholder="Capacity" required min="1"/>
          <button type="submit">{isEditing ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default ElectivesPage;

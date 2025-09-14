import React, { useState, useEffect } from 'react';
import Modal from 'src/components/Modal';
import './ClassroomsPage.css'; // Import the CSS file

function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Classroom form states
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [isEditingClassroom, setIsEditingClassroom] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(0);
  const [resources, setResources] = useState('');

  // Seating Plan states
  const [showSeatingPlanModal, setShowSeatingPlanModal] = useState(false);
  const [classroomForSeatingPlan, setClassroomForSeatingPlan] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatchForSeating, setSelectedBatchForSeating] = useState('');
  const [generatedSeatingPlan, setGeneratedSeatingPlan] = useState(null);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const token = localStorage.getItem('accessToken');
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/classrooms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to fetch classrooms');
      }
      const data = await response.json();
      setClassrooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const coursesResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/courses', { headers: { Authorization: `Bearer ${token}` } });
      if (!coursesResponse.ok) throw new Error('Failed to fetch courses for batches');
      const coursesData = await coursesResponse.json();

      const allBatches = [];
      for (const course of coursesData) {
        const batchesResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/courses/${course.id}/batches`, { headers: { Authorization: `Bearer ${token}` } });
        if (batchesResponse.ok) {
          const batchesData = await batchesResponse.json();
          allBatches.push(...batchesData);
        }
      }
      setBatches(allBatches);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchClassrooms();
    fetchBatches();
  }, []);

  // --- Classroom Handlers ---
  const handleAddClassroom = () => {
    setIsEditingClassroom(false);
    setCurrentClassroom(null);
    setName('');
    setCapacity(0);
    setResources('');
    setShowClassroomModal(true);
  };

  const handleEditClassroom = (classroom) => {
    setIsEditingClassroom(true);
    setCurrentClassroom(classroom);
    setName(classroom.name);
    setCapacity(classroom.capacity);
    setResources(classroom.resources.join(', '));
    setShowClassroomModal(true);
  };

  const handleDeleteClassroom = async (classroomId) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/classrooms/${classroomId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Failed to delete classroom');
        }
        setMessage('Classroom deleted successfully.');
        fetchClassrooms();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleClassroomSubmit = async (e) => {
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
    const url = isEditingClassroom
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/classrooms/${currentClassroom.id}`
      : import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/classrooms';
    const method = isEditingClassroom ? 'PUT' : 'POST';
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
      setShowClassroomModal(false);
      setMessage(isEditingClassroom ? 'Classroom updated successfully.' : 'Classroom created successfully.');
      fetchClassrooms();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Seating Plan Handlers ---
  const handleGenerateSeatingPlanClick = (classroom) => {
    setClassroomForSeatingPlan(classroom);
    setSelectedBatchForSeating('');
    setGeneratedSeatingPlan(null);
    setShowSeatingPlanModal(true);
  };

  const handleSeatingPlanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatchForSeating) {
      setError('Please select a batch.');
      return;
    }

    try {
      setError('');
      setMessage('');
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/classrooms/${classroomForSeatingPlan.id}/generate-seating-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ batch_id: selectedBatchForSeating }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to generate seating plan');
      }

      const data = await response.json();
      setGeneratedSeatingPlan(data.plan);
      setMessage('Seating plan generated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="classrooms-container">Loading...</div>;

  return (
    <div className="classrooms-container">
      <h1 className="page-title">Manage Classrooms</h1>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
      <button onClick={handleAddClassroom}>Add Classroom</button>

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
                  <button className="edit-btn" onClick={() => handleEditClassroom(c)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDeleteClassroom(c.id)}>Delete</button>
                  <button className="generate-seating-btn" onClick={() => handleGenerateSeatingPlanClick(c)}>Generate Seating Plan</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Classroom Add/Edit Modal */}
      <Modal show={showClassroomModal} onClose={() => setShowClassroomModal(false)}>
        <form onSubmit={handleClassroomSubmit}>
          <h3>{isEditingClassroom ? 'Edit' : 'Add'} Classroom</h3>
          {error && <div className="error">{error}</div>}
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
          <input type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} placeholder="Capacity" required min="1"/>
          <input type="text" value={resources} onChange={e => setResources(e.target.value)} placeholder="Resources (comma-separated)" />
          <button type="submit">{isEditingClassroom ? 'Update' : 'Create'}</button>
        </form>
      </Modal>

      {/* Seating Plan Generation Modal */}
      <Modal show={showSeatingPlanModal} onClose={() => setShowSeatingPlanModal(false)}>
        <form onSubmit={handleSeatingPlanSubmit}>
          <h3>Generate Seating Plan for {classroomForSeatingPlan?.name}</h3>
          {error && <div className="error">{error}</div>}
          <label>
            Select Batch:
            <select value={selectedBatchForSeating} onChange={e => setSelectedBatchForSeating(e.target.value)} required>
              <option value="">Select Batch</option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
            </select>
          </label>
          <button type="submit">Generate Plan</button>
        </form>

        {generatedSeatingPlan && (
          <div className="seating-plan-display">
            <h4>Generated Seating Plan:</h4>
            <div className="seating-grid">
              {Object.entries(generatedSeatingPlan).map(([seat, studentEmail]) => (
                <div key={seat} className="seat-item">
                  <strong>{seat}:</strong> {studentEmail}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ClassroomsPage;

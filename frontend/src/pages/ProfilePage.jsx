import React, { useState, useEffect } from 'react';
import { useAuth } from 'src/contexts/AuthContext.jsx';
import { storage } from 'src/services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ProfilePage.css'; // Import the CSS file

function ProfilePage() {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [unavailableSlots, setUnavailableSlots] = useState(''); // New state for availability

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://127.0.0.1:8000/api/v1/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch user profile');
        const data = await response.json();
        setUserProfile(data);
        setDisplayName(data.display_name || '');
        setDepartment(data.department || '');
        setBatch(data.batch || '');
        setStudentId(data.student_id || '');
        setFacultyId(data.faculty_id || '');
        setUnavailableSlots(data.unavailable_slots ? data.unavailable_slots.join(', ') : ''); // Populate availability
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserProfile();
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const updatedData = { display_name: displayName, department, batch, student_id: studentId, faculty_id: facultyId };
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/users/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }
      const data = await response.json();
      setUserProfile(data);
      alert('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photo) return;
    setUploading(true);
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', photo);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/users/me/photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload photo');
      }
      const data = await response.json();
      setUserProfile({ ...userProfile, photo_url: data.photo_url });
      alert('Photo uploaded successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateAvailability = async () => {
    const token = localStorage.getItem('accessToken');
    const slotsArray = unavailableSlots.split(',').map(s => s.trim()).filter(s => s);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/users/me/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(slotsArray),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update availability');
      }
      alert('Availability updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="profile-container">Loading...</div>;
  if (error) return <div className="profile-container error">Error: {error}</div>;

  return (
    <div className="profile-container">
      <h1 className="page-title">Profile</h1>
      {userProfile && (
        <div className="profile-content">
          <div className="profile-header">
            <img src={userProfile.photo_url || 'https://via.placeholder.com/150'} alt="Profile" className="profile-photo" />
            <div>
              <p><strong>Email:</strong> {userProfile.email}</p>
              <p><strong>Role:</strong> {userProfile.role}</p>
            </div>
          </div>
          
          <section className="profile-section">
            <h3>Update Personal Information</h3>
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" />
              <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department" />
              {userProfile.role === 'student' && <input type="text" value={batch} onChange={e => setBatch(e.target.value)} placeholder="Batch" />}
              {userProfile.role === 'student' && <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student ID" />}
              {userProfile.role === 'faculty' && <input type="text" value={facultyId} onChange={e => setFacultyId(e.target.value)} placeholder="Faculty ID" />}
              <button type="submit">Update Profile</button>
            </form>
          </section>

          <section className="profile-section">
            <h3>Update Profile Photo</h3>
            <div className="photo-upload-section">
              <input type="file" onChange={handlePhotoChange} />
              <button onClick={handlePhotoUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
          </section>

          {userProfile.role === 'faculty' && (
            <section className="profile-section">
              <h3>Update Availability (Faculty Only)</h3>
              <textarea
                value={unavailableSlots}
                onChange={e => setUnavailableSlots(e.target.value)}
                placeholder="Enter unavailable time slots (e.g., Mon_9-10, Tue_11-12)"
                rows="5"
              ></textarea>
              <button onClick={handleUpdateAvailability}>Update Availability</button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfilePage;

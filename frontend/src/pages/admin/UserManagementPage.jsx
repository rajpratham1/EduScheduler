import React, { useState, useEffect } from 'react';
import Modal from 'src/components/Modal';
import './UserManagementPage.css';

function UserManagementPage() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]); // New state for approved users
  const [enrolledStudents, setEnrolledStudents] = useState([]); // New state for enrolled students
  const [courses, setCourses] = useState([]); // New state for courses
  const [batches, setBatches] = useState([]); // New state for batches

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Enrollment Modal states
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [userToEnroll, setUserToEnroll] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const fetchAllUserData = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch pending users
      const pendingResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/users/pending', { headers });
      if (!pendingResponse.ok) throw new Error('Failed to fetch pending users');
      const pendingData = await pendingResponse.json();
      setPendingUsers(pendingData);

      // Fetch all users to categorize them
      const allUsersResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/users/all', { headers }); // Assuming an /all endpoint exists or will be created
      if (!allUsersResponse.ok) throw new Error('Failed to fetch all users');
      const allUsersData = await allUsersResponse.json();

      const approved = [];
      const enrolled = [];
      allUsersData.forEach(user => {
        if (user.status === 'approved' && !user.student_id) {
          approved.push(user);
        } else if (user.status === 'enrolled' && user.student_id) {
          enrolled.push(user);
        }
      });
      setApprovedUsers(approved);
      setEnrolledStudents(enrolled);

      // Fetch courses and batches for enrollment dropdowns
      const coursesResponse = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/courses', { headers });
      if (!coursesResponse.ok) throw new Error('Failed to fetch courses');
      const coursesData = await coursesResponse.json();
      setCourses(coursesData);

      // Fetch batches for all courses (can be optimized to fetch only for selected course)
      const allBatches = [];
      for (const course of coursesData) {
        const batchesResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/courses/${course.id}/batches`, { headers });
        if (batchesResponse.ok) {
          const batchesData = await batchesResponse.json();
          allBatches.push(...batchesData);
        }
      }
      setBatches(allBatches);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUserData();
  }, []);

  const handleApprove = async (email) => {
    try {
      setError('');
      setMessage('');
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users/${email}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to approve user');
      }

      const resData = await response.json();
      setMessage(resData.message || `User ${email} approved successfully.`);
      fetchAllUserData(); // Re-fetch all data to update sections
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEnrollClick = (user) => {
    setUserToEnroll(user);
    setSelectedCourse('');
    setSelectedBatch('');
    setShowEnrollModal(true);
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !selectedBatch) {
      setError('Please select both a course and a batch.');
      return;
    }

    try {
      setError('');
      setMessage('');
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users/${userToEnroll.email}/enroll`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: selectedCourse, batch_id: selectedBatch }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to enroll student');
      }

      const resData = await response.json();
      setMessage(`Student ${userToEnroll.email} enrolled successfully with ID: ${resData.student_id}`);
      setShowEnrollModal(false);
      fetchAllUserData(); // Re-fetch all data to update sections
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="user-management-container">Loading...</div>;

  return (
    <div className="user-management-container">
      <h1 className="page-title">User Management</h1>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <section className="pending-approvals">
        <h2>Pending Approvals</h2>
        {pendingUsers.length === 0 ? (
          <p>No pending user approvals.</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Display Name</th>
                <th>Admin ID Provided</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.display_name || 'N/A'}</td>
                  <td>{user.admin_id || 'N/A'}</td>
                  <td>
                    <button className="approve-btn" onClick={() => handleApprove(user.email)}>
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="approved-users">
        <h2>Approved Users (Ready for Enrollment)</h2>
        {approvedUsers.length === 0 ? (
          <p>No approved users awaiting enrollment.</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Display Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvedUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.display_name || 'N/A'}</td>
                  <td>
                    <button className="enroll-btn" onClick={() => handleEnrollClick(user)}>
                      Enroll Student
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="enrolled-students">
        <h2>Enrolled Students</h2>
        {enrolledStudents.length === 0 ? (
          <p>No students currently enrolled.</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Student ID</th>
                <th>Course</th>
                <th>Batch</th>
              </tr>
            </thead>
            <tbody>
              {enrolledStudents.map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.student_id}</td>
                  <td>{courses.find(c => c.id === user.course_id)?.name || user.course_id}</td>
                  <td>{batches.find(b => b.id === user.batch_id)?.name || user.batch_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Enrollment Modal */}
      <Modal show={showEnrollModal} onClose={() => setShowEnrollModal(false)}>
        <form onSubmit={handleEnrollSubmit}>
          <h3>Enroll Student: {userToEnroll?.email}</h3>
          {error && <div className="error">{error}</div>}
          <label>
            Course:
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} required>
              <option value="">Select a Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </label>
          <label>
            Batch:
            <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} required>
              <option value="">Select a Batch</option>
              {batches.filter(batch => batch.course_id === selectedCourse).map(batch => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
            </select>
          </label>
          <button type="submit">Enroll</button>
        </form>
      </Modal>
    </div>
  );
}

export default UserManagementPage;
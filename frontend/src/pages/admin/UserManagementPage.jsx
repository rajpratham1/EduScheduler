import React, { useState, useEffect } from 'react';
import './UserManagementPage.css';

function UserManagementPage() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/users/pending', { headers });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to fetch pending users');
      }

      const data = await response.json();
      setPendingUsers(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
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
      // Refresh list after approval
      setPendingUsers(prevUsers => prevUsers.filter(user => user.email !== email));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="user-management-container">
      <h1 className="page-title">User Management</h1>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <section className="pending-approvals">
        <h2>Pending Approvals</h2>
        {loading ? (
          <p>Loading pending users...</p>
        ) : pendingUsers.length === 0 ? (
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
    </div>
  );
}

export default UserManagementPage;

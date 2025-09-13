import React, { useState, useEffect } from 'react';
import './UserManagementPage.css'; // Assuming you'll create this CSS file

function UserManagementPage() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const pendingResponse = await fetch('http://127.0.0.1:8000/api/v1/admin/users/pending', { headers });
      if (!pendingResponse.ok) throw new Error('Failed to fetch pending users');
      const pendingData = await pendingResponse.json();
      setPendingUsers(pendingData);

      const allUsersResponse = await fetch('http://127.0.0.1:8000/api/v1/users/all', { headers });
      if (!allUsersResponse.ok) throw new Error('Failed to fetch all users');
      const allUsersData = await allUsersResponse.json();
      setAllUsers(allUsersData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (email) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://127.0.0.1:8000/api/v1/admin/users/approve/${email}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDisapprove = async (email) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://127.0.0.1:8000/api/v1/admin/users/disapprove/${email}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangeRole = async (email, newRole) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://127.0.0.1:8000/api/v1/admin/users/role/${email}?new_role=${newRole}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="user-management-container">Loading...</div>;
  if (error) return <div className="user-management-container error">Error: {error}</div>;

  return (
    <div className="user-management-container">
      <h1 className="page-title">User Management</h1>

      <section className="pending-approvals">
        <h3>Pending Approvals</h3>
        {pendingUsers.length === 0 ? (
          <p>No pending user approvals.</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button className="approve-btn" onClick={() => handleApprove(user.email)}>Approve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="all-users">
        <h3>All Users</h3>
        {allUsers.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    <select value={user.role} onChange={(e) => handleChangeRole(user.email, e.target.value)}>
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{user.is_approved ? 'Yes' : 'No'}</td>
                  <td>
                    {user.is_approved ? (
                      <button className="disapprove-btn" onClick={() => handleDisapprove(user.email)}>Disapprove</button>
                    ) : (
                      <button className="approve-btn" onClick={() => handleApprove(user.email)}>Approve</button>
                    )}
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

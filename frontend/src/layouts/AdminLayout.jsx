import React from 'react';
import { Link, Outlet } from 'react-router-dom';

function AdminLayout() {
  return (
    <div>
      <nav>
        <ul>
          <li><Link to="/dashboard/admin/faculty">Manage Faculty</Link></li>
          <li><Link to="/dashboard/admin/students">Manage Students</Link></li>
          <li><Link to="/dashboard/admin/subjects">Manage Subjects</Link></li>
          <li><Link to="/dashboard/admin/classrooms">Manage Classrooms</Link></li>
          <li><Link to="/dashboard/admin/timetables">Manage Timetables</Link></li>
        </ul>
      </nav>
      <hr />
      <Outlet />
    </div>
  );
}

export default AdminLayout;

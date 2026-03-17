import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { userService } from '../../services/firestoreService';

const AdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="admin-header-actions">
        <h2>User Management</h2>
        <p style={{ color: 'var(--text-light)', marginTop: '4px' }}>{users.length} registered users</p>
      </div>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No users found.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'var(--primary)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem'
                    }}>
                      {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    {u.displayName || u.name || '—'}
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`status-badge ${u.role === 'admin' ? 'active' : ''}`}>
                    {u.role || 'customer'}
                  </span>
                </td>
                <td>{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

import React from 'react';
import AdminLayout from './AdminLayout';

const AdminSettings = () => {
    return (
        <AdminLayout>
            <div className="admin-header-actions">
                <h2>Admin Settings</h2>
            </div>

            <div className="admin-card" style={{ background: 'var(--bg-soft)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: 'var(--border)' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: 'var(--white)', marginBottom: '1rem' }}>General Settings</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Configure site-wide settings and preferences.</p>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Store Name</label>
                        <input type="text" defaultValue="Retrostylings" style={{ width: '100%', background: 'var(--bg-main)', border: 'var(--border)', color: 'var(--white)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Contact Email</label>
                        <input type="email" defaultValue="support@retrostylings.com" style={{ width: '100%', background: 'var(--bg-main)', border: 'var(--border)', color: 'var(--white)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;

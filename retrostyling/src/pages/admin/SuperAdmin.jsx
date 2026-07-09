import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  Shield, Users, Key, Activity, AlertTriangle, Eye,
  Plus, Edit2, Trash2, Search, Lock, Unlock, FileText, RefreshCw, Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { seedService } from '../../services/firestoreService';

const mockAdmins = [
  { id: 1, name: 'Muneeswaran', email: 'muneeswaran@retrostylings.com', role: 'superadmin', status: 'active', lastLogin: '2026-07-08T18:32', createdAt: '2025-01-01' },
  { id: 2, name: 'Priya Admin', email: 'priya@retrostylings.com', role: 'admin', status: 'active', lastLogin: '2026-07-07T10:15', createdAt: '2025-06-01' },
  { id: 3, name: 'Kiran Staff', email: 'kiran@retrostylings.com', role: 'staff', status: 'inactive', lastLogin: '2026-06-20T14:20', createdAt: '2026-01-15' },
];

const mockRoles = [
  { id: 1, name: 'Super Admin', slug: 'superadmin', permissions: ['all'], users: 1, color: '#FF4D4D' },
  { id: 2, name: 'Admin', slug: 'admin', permissions: ['products', 'orders', 'customers', 'coupons', 'reports'], users: 1, color: '#8B5CF6' },
  { id: 3, name: 'Staff', slug: 'staff', permissions: ['orders', 'inventory'], users: 1, color: '#3B82F6' },
];

const mockLogs = [
  { id: 1, user: 'Muneeswaran', action: 'Updated product: Leather Jacket', module: 'Products', time: '2026-07-08T18:32', ip: '192.168.1.1' },
  { id: 2, user: 'Priya Admin', action: 'Approved review #R-1024', module: 'Reviews', time: '2026-07-07T10:15', ip: '192.168.1.2' },
  { id: 3, user: 'Muneeswaran', action: 'Created coupon: SUMMER30', module: 'Coupons', time: '2026-07-06T14:20', ip: '192.168.1.1' },
  { id: 4, user: 'Kiran Staff', action: 'Updated order #ORD-2841 status to Shipped', module: 'Orders', time: '2026-06-20T14:20', ip: '192.168.1.3' },
  { id: 5, user: 'Muneeswaran', action: 'Deleted product: Old Model Sneakers', module: 'Products', time: '2026-06-19T10:05', ip: '192.168.1.1' },
  { id: 6, user: 'Priya Admin', action: 'Created banner: Flash Sale', module: 'Banners', time: '2026-06-18T16:30', ip: '192.168.1.2' },
];

const ALL_PERMISSIONS = ['products', 'categories', 'brands', 'inventory', 'orders', 'customers', 'coupons', 'banners', 'reviews', 'marketing', 'reports', 'analytics', 'media', 'settings'];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const SuperAdmin = () => {
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState(mockAdmins);
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState('');

  const handleSeed = async () => {
    if (!window.confirm('Are you sure you want to seed the database with products, categories, hero slides, and dummy orders?')) return;
    setSeeding(true);
    setSeedStatus('Initializing seed...');
    try {
      await seedService.run();
      setSeedStatus('Database seeded successfully!');
      alert('Database seeded successfully! All products, categories, slides, and orders have been saved in Firebase.');
    } catch (err) {
      console.error(err);
      setSeedStatus('Failed to seed: ' + err.message);
      alert('Error seeding database: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const filteredAdmins = admins.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));

  const TABS = [
    { id: 'admins', label: 'Admin Users', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Key },
    { id: 'logs', label: 'Activity Logs', icon: Activity },
    { id: 'system', label: 'System', icon: Shield },
  ];

  const toggleStatus = (id) => setAdmins(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a));

  const formatTime = (t) => { const d = new Date(t); return d.toLocaleDateString('en-IN') + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); };

  return (
    <AdminLayout>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Super Admin</h1>
            <p className="page-subtitle">Manage admin users, roles, permissions, and system audit logs.</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </motion.div>

        {/* Admin Users */}
        {activeTab === 'admins' && (
          <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div className="search-wrapper" style={{ maxWidth: 320 }}>
                <Search size={16} className="search-icon" />
                <input className="form-input search-input" placeholder="Search admins..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-sm"><Plus size={14} /> Add Admin</button>
            </div>
            <motion.div className="table-card" variants={itemVariants}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Admin</th><th>Email</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map(admin => (
                      <tr key={admin.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div className="order-avatar">{admin.name.charAt(0)}</div>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{admin.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{admin.email}</td>
                        <td>
                          <span className={`badge ${admin.role === 'superadmin' ? 'badge-error' : admin.role === 'admin' ? 'badge-secondary' : 'badge-info'}`}>
                            {admin.role}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatTime(admin.lastLogin)}</td>
                        <td><span className={`badge ${admin.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{admin.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => toggleStatus(admin.id)} title="Toggle Status">
                              {admin.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                            {admin.role !== 'superadmin' && (
                              <button className="btn btn-ghost btn-icon btn-sm"><Trash2 size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Roles & Permissions */}
        {activeTab === 'roles' && (
          <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mockRoles.map(role => (
              <motion.div key={role.id} className="role-card" variants={itemVariants}>
                <div className="role-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="role-icon" style={{ background: role.color + '18', color: role.color }}>
                      <Key size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700 }}>{role.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{role.users} user{role.users !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  {role.slug !== 'superadmin' && <button className="btn btn-secondary btn-sm"><Edit2 size={13} /> Edit Permissions</button>}
                </div>
                <div className="role-permissions">
                  {role.permissions[0] === 'all' ? (
                    <span className="badge badge-error">Full Access — All Permissions</span>
                  ) : (
                    role.permissions.map(p => (
                      <span key={p} className="tag tag-primary">{p}</span>
                    ))
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Activity Logs */}
        {activeTab === 'logs' && (
          <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="search-wrapper" style={{ maxWidth: 320 }}>
                <Search size={16} className="search-icon" />
                <input className="form-input search-input" placeholder="Search logs..." />
              </div>
              <button className="btn btn-secondary btn-sm"><FileText size={14} /> Export Logs</button>
            </div>
            <motion.div className="table-card" variants={itemVariants}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>IP</th></tr>
                  </thead>
                  <tbody>
                    {mockLogs.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatTime(log.time)}</td>
                        <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{log.action}</td>
                        <td><span className="badge badge-neutral">{log.module}</span></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* System */}
        {activeTab === 'system' && (
          <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { title: 'Database Seeder', desc: seeding ? `Seeding: ${seedStatus}` : 'Wipe and re-initialize Firebase collections (products, categories, slides, orders) using dataset from products.js.', icon: Database, action: 'Seed Data', color: '#DFFF1B', onClick: handleSeed, loading: seeding },
              { title: 'Database Backup', desc: 'Last backup: 2026-07-08 at 2:00 AM', icon: Shield, action: 'Run Backup', color: '#22C55E' },
              { title: 'Cache Management', desc: 'Clear app cache and rebuild static assets', icon: RefreshCw, action: 'Clear Cache', color: '#3B82F6' },
              { title: 'Security Audit', desc: 'Scan for vulnerabilities and misconfigurations', icon: AlertTriangle, action: 'Run Audit', color: '#F59E0B' },
              { title: 'System Logs', desc: 'View detailed server and application logs', icon: FileText, action: 'View Logs', color: '#8B5CF6' },
            ].map((item, i) => (
              <motion.div key={i} className="system-card" variants={itemVariants}>
                <div className="role-icon" style={{ background: item.color + '18', color: item.color }}><item.icon size={20} /></div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={item.onClick || (() => {})} disabled={item.loading}>
                  {item.loading ? 'Running...' : item.action}
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <style>{`
        .role-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .role-header { display: flex; align-items: center; justify-content: space-between; }
        .role-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .role-permissions { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .order-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-light), rgba(139,92,246,0.15)); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; color: var(--primary); flex-shrink: 0; }
        .system-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; display: flex; align-items: center; gap: 1rem; transition: var(--transition-fast); }
        .system-card:hover { border-color: var(--border-bright); }
        .table-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
        .table-card-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
      `}</style>
    </AdminLayout>
  );
};

export default SuperAdmin;

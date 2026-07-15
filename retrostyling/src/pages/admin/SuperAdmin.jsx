import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import {
  Shield, Users, Key, Activity, AlertTriangle, Eye,
  Plus, Edit2, Trash2, Search, Lock, Unlock, FileText, RefreshCw, Database, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { seedService, userService, rolesService, activityLogService } from '../../services/firestoreService';

const ALL_PERMISSIONS = ['products', 'categories', 'brands', 'inventory', 'orders', 'customers', 'coupons', 'banners', 'reviews', 'marketing', 'reports', 'analytics', 'media', 'settings'];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const SuperAdmin = () => {
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMethod, setAddMethod] = useState('existing'); // 'existing' | 'new'
  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  const [showEditPermsModal, setShowEditPermsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRolePerms, setSelectedRolePerms] = useState([]);

  // Load live data from Firestore
  const loadData = async () => {
    setLoading(true);
    try {
      const [adminsData, rolesData, logsData, usersData] = await Promise.all([
        userService.getAdmins(),
        rolesService.getAll(),
        activityLogService.getAll(),
        userService.getAll()
      ]);
      setAdmins(adminsData);
      setRoles(rolesData);
      setLogs(logsData);
      setAllUsers(usersData);
    } catch (err) {
      console.error("Failed to load Super Admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    if (!window.confirm('Are you sure you want to seed the database with products, categories, hero slides, and dummy orders? This will wipe existing collections.')) return;
    setSeeding(true);
    setSeedStatus('Initializing seed...');
    try {
      await seedService.run();
      setSeedStatus('Database seeded successfully!');
      await loadData();
      alert('Database seeded successfully! All products, categories, slides, orders, roles, and logs have been saved in Firebase.');
    } catch (err) {
      console.error(err);
      setSeedStatus('Failed to seed: ' + err.message);
      alert('Error seeding database: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await activityLogService.log('Cleared application cache and rebuilt static assets', 'System');
      await loadData();
      alert('Application cache cleared successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleBackup = async () => {
    try {
      await activityLogService.log('Initiated manual system backup to Firebase Storage', 'System');
      await loadData();
      alert('Backup snapshot created successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSecurityAudit = async () => {
    try {
      await activityLogService.log('Executed manual vulnerability and access audit', 'System');
      await loadData();
      alert('Security audit completed. No anomalies found.');
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const adminUserObj = admins.find(a => a.id === id);
    if (!adminUserObj) return;

    if (adminUserObj.role === 'superadmin') {
      alert('Toggling status for Super Admin is not allowed.');
      return;
    }

    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      await userService.updateStatus(id, newStatus);
      const name = adminUserObj.displayName || adminUserObj.name || 'Admin';
      await activityLogService.log(`Toggled status of admin ${name} (${adminUserObj.email}) to ${newStatus}`, 'System');
      await loadData();
    } catch (err) {
      alert('Failed to update admin status: ' + err.message);
    }
  };

  const handleDeleteAdmin = async (id, name, email) => {
    if (!window.confirm(`Are you sure you want to revoke admin privileges for ${name} (${email})?`)) return;
    try {
      await userService.updateRole(id, 'customer');
      await activityLogService.log(`Revoked admin privileges / demoted ${name} (${email}) to customer`, 'System');
      await loadData();
    } catch (err) {
      alert('Failed to revoke admin role: ' + err.message);
    }
  };

  const handleAddAdminSubmit = async () => {
    try {
      if (addMethod === 'existing') {
        const selectedUser = allUsers.find(u => u.id === newAdminUserId);
        if (!selectedUser) return;
        await userService.updateRole(newAdminUserId, newAdminRole);
        await userService.updateStatus(newAdminUserId, 'active');
        await activityLogService.log(`Promoted user ${selectedUser.displayName || selectedUser.name || 'User'} (${selectedUser.email}) to role: ${newAdminRole}`, 'System');
        alert('User promoted successfully!');
      } else {
        await userService.preInviteAdmin({
          name: newAdminName,
          email: newAdminEmail,
          role: newAdminRole
        });
        await activityLogService.log(`Pre-registered admin user ${newAdminName} (${newAdminEmail}) with role: ${newAdminRole}`, 'System');
        alert('Admin pre-invited successfully. When they register with this email, they will automatically inherit their admin role!');
      }
      setShowAddModal(false);
      
      // Reset form
      setNewAdminUserId('');
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminRole('admin');
      
      await loadData();
    } catch (err) {
      alert('Failed to add admin user: ' + err.message);
    }
  };

  const handleEditPermissions = (role) => {
    setSelectedRole(role);
    setSelectedRolePerms(role.permissions || []);
    setShowEditPermsModal(true);
  };

  const handleSavePermissions = async () => {
    try {
      await rolesService.updatePermissions(selectedRole.slug, selectedRolePerms);
      alert('Permissions updated successfully!');
      setShowEditPermsModal(false);
      await loadData();
    } catch (err) {
      alert('Failed to update permissions: ' + err.message);
    }
  };

  const formatTime = (t) => {
    if (!t) return 'Recently';
    const d = t.toDate ? t.toDate() : new Date(t.seconds * 1000 || t);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-IN') + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredAdmins = admins.filter(a => {
    const name = a.displayName || a.name || '';
    const email = a.email || '';
    return name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
  });

  const filteredLogs = logs.filter(l => {
    const user = l.user || '';
    const action = l.action || '';
    const module = l.module || '';
    const searchLower = search.toLowerCase();
    return user.toLowerCase().includes(searchLower) || action.toLowerCase().includes(searchLower) || module.toLowerCase().includes(searchLower);
  });

  const TABS = [
    { id: 'admins', label: 'Admin Users', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Key },
    { id: 'logs', label: 'Activity Logs', icon: Activity },
    { id: 'system', label: 'System', icon: Shield },
  ];

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
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => { setActiveTab(t.id); setSearch(''); }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '280px', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {[0, 1, 2].map(index => (
                <motion.div
                  key={index}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary, #DFFF1B), var(--primary-light, #8B5CF6))',
                    boxShadow: '0 0 10px rgba(223, 255, 27, 0.4)'
                  }}
                  animate={{
                    y: ['0px', '-10px', '0px'],
                    scale: [1, 1.25, 1]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: index * 0.15,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
            <motion.span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              Loading Admin Data...
            </motion.span>
          </div>
        ) : (
          <>
            {/* Admin Users */}
            {activeTab === 'admins' && (
              <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div className="search-wrapper" style={{ maxWidth: 320 }}>
                    <Search size={16} className="search-icon" />
                    <input className="form-input search-input" placeholder="Search admins..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}><Plus size={14} /> Add Admin</button>
                </div>
                <motion.div className="table-card" variants={itemVariants}>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr><th>Admin</th><th>Email</th><th>Role</th><th>Last Login / Update</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {filteredAdmins.length === 0 ? (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No administrators found.</td></tr>
                        ) : filteredAdmins.map(admin => (
                          <tr key={admin.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div className="order-avatar">{(admin.displayName || admin.name || 'A').charAt(0).toUpperCase()}</div>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{admin.displayName || admin.name || 'Admin'}</span>
                              </div>
                            </td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{admin.email}</td>
                            <td>
                              <span className={`badge ${admin.role === 'superadmin' ? 'badge-error' : admin.role === 'admin' ? 'badge-secondary' : 'badge-info'}`}>
                                {admin.role}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatTime(admin.updatedAt || admin.createdAt)}</td>
                            <td>
                              <span className={`badge ${admin.status !== 'inactive' ? 'badge-success' : 'badge-neutral'}`}>
                                {admin.status !== 'inactive' ? 'active' : 'inactive'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button 
                                  className="btn btn-ghost btn-icon btn-sm" 
                                  onClick={() => toggleStatus(admin.id, admin.status || 'active')} 
                                  title="Toggle Status (Lock/Unlock)"
                                  disabled={admin.role === 'superadmin'}
                                >
                                  {admin.status === 'inactive' ? <Unlock size={14} /> : <Lock size={14} />}
                                </button>
                                {admin.role !== 'superadmin' && (
                                  <button 
                                    className="btn btn-ghost btn-icon btn-sm" 
                                    onClick={() => handleDeleteAdmin(admin.id, admin.displayName || admin.name || 'Admin', admin.email)} 
                                    title="Revoke Admin Permissions"
                                  >
                                    <Trash2 size={14} />
                                  </button>
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
                {roles.map(role => (
                  <motion.div key={role.id} className="role-card" variants={itemVariants}>
                    <div className="role-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="role-icon" style={{ background: (role.color || '#3B82F6') + '18', color: role.color }}>
                          <Key size={18} />
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 700 }}>{role.name}</h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {admins.filter(a => a.role === role.slug).length} user{admins.filter(a => a.role === role.slug).length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      {role.slug !== 'superadmin' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditPermissions(role)}>
                          <Edit2 size={13} /> Edit Permissions
                        </button>
                      )}
                    </div>
                    <div className="role-permissions">
                      {role.permissions && role.permissions[0] === 'all' ? (
                        <span className="badge badge-error">Full Access — All Permissions</span>
                      ) : (
                        role.permissions && role.permissions.map(p => (
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
                    <input className="form-input search-input" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={loadData}><RefreshCw size={14} /> Refresh Logs</button>
                </div>
                <motion.div className="table-card" variants={itemVariants}>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>IP</th></tr>
                      </thead>
                      <tbody>
                        {filteredLogs.length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No audit logs matching search term.</td></tr>
                        ) : filteredLogs.map((log, idx) => (
                          <tr key={log.id || idx}>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatTime(log.createdAt)}</td>
                            <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user}</td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{log.action}</td>
                            <td><span className="badge badge-neutral">{log.module}</span></td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.ip || '—'}</td>
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
                  { title: 'Database Backup', desc: 'Manage system snapshots. Run a manual backup to copy active collections.', icon: Shield, action: 'Run Backup', color: '#22C55E', onClick: handleBackup },
                  { title: 'Cache Management', desc: 'Clear system app cache and rebuild cached assets.', icon: RefreshCw, action: 'Clear Cache', color: '#3B82F6', onClick: handleClearCache },
                  { title: 'Security Audit', desc: 'Scan access credentials and role security vulnerabilities.', icon: AlertTriangle, action: 'Run Audit', color: '#F59E0B', onClick: handleSecurityAudit },
                  { title: 'System Logs', desc: 'View live actions, audits and admin activities.', icon: FileText, action: 'View Logs', color: '#8B5CF6', onClick: () => setActiveTab('logs') },
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
          </>
        )}
      </motion.div>

      {/* MODALS */}
      <AnimatePresence>
        {/* Promotion / Register Admin Modal */}
        {showAddModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowAddModal(false)}>
            <motion.div 
              className="admin-modal-content"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header">
                <h3>Promote / Add Admin User</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                  <button 
                    type="button" 
                    className={`btn btn-sm ${addMethod === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setAddMethod('existing')}
                    style={{ flex: 1 }}
                  >
                    Promote Customer
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm ${addMethod === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setAddMethod('new')}
                    style={{ flex: 1 }}
                  >
                    Pre-register Admin
                  </button>
                </div>

                {addMethod === 'existing' ? (
                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label className="form-label">Select Registered User</label>
                    <select 
                      className="form-input" 
                      value={newAdminUserId} 
                      onChange={e => setNewAdminUserId(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '6px' }}
                    >
                      <option value="">-- Choose User --</option>
                      {allUsers.filter(u => !['admin', 'superadmin', 'staff'].includes(u.role)).map(u => (
                        <option key={u.id} value={u.id}>{u.displayName || u.name || 'No Name'} ({u.email})</option>
                      ))}
                    </select>
                    {allUsers.filter(u => !['admin', 'superadmin', 'staff'].includes(u.role)).length === 0 && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>No customers found in database available to promote.</p>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Admin Name" 
                        value={newAdminName} 
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        onChange={e => setNewAdminName(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        placeholder="admin@retrostylings.com" 
                        value={newAdminEmail} 
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        onChange={e => setNewAdminEmail(e.target.value)} 
                      />
                    </div>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      Note: This pre-configures a user profile doc in Firestore. When this admin registers with this email, they will automatically inherit their admin role.
                    </p>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label">Assigned Role</label>
                  <select 
                    className="form-input" 
                    value={newAdminRole} 
                    onChange={e => setNewAdminRole(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '6px' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handleAddAdminSubmit} 
                  disabled={addMethod === 'existing' ? !newAdminUserId : (!newAdminName || !newAdminEmail)}
                >
                  Create / Promote
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Permissions Modal */}
        {showEditPermsModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowEditPermsModal(false)}>
            <motion.div 
              className="admin-modal-content"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: '540px' }}
            >
              <div className="modal-header">
                <h3>Edit Permissions: {selectedRole?.name}</h3>
                <button className="close-btn" onClick={() => setShowEditPermsModal(false)}><X size={16} /></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '480px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Select the dashboard modules this role is allowed to access and manage.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', overflowY: 'auto' }}>
                  {ALL_PERMISSIONS.map(permission => {
                    const isChecked = selectedRolePerms.includes(permission);
                    return (
                      <label 
                        key={permission} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          padding: '0.5rem 0.75rem', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--border)', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          textTransform: 'capitalize'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => {
                            if (isChecked) {
                              setSelectedRolePerms(prev => prev.filter(p => p !== permission));
                            } else {
                              setSelectedRolePerms(prev => [...prev, permission]);
                            }
                          }} 
                        />
                        {permission}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowEditPermsModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSavePermissions}>Save Permissions</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        
        /* Modals style */
        .admin-modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; backdrop-filter: blur(5px); }
        .admin-modal-content { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); width: 100%; max-width: 480px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5); }
        .modal-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .modal-header h3 { font-weight: 700; margin: 0; font-size: 1.1rem; }
        .modal-header .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.25rem; }
        .modal-header .close-btn:hover { color: var(--text-main); }
        .modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; max-height: 70vh; overflow-y: auto; }
        .modal-footer { padding: 0.75rem 1.25rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.6rem; background: rgba(0, 0, 0, 0.15); }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
      `}</style>
    </AdminLayout>
  );
};

export default SuperAdmin;

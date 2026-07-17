import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Plus, Edit2, Trash2, Search, Copy, Tag, Percent, Truck, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const couponTypeIcon = (type) => {
  if (type === 'percentage') return <Percent size={14} />;
  if (type === 'flat') return <Tag size={14} />;
  return <Truck size={14} />;
};

const couponTypeLabel = (type) => {
  if (type === 'percentage') return 'Percentage';
  if (type === 'flat') return 'Flat Discount';
  return 'Free Shipping';
};

const couponValue = (c) => {
  if (c.type === 'percentage') return `${c.value}% off`;
  if (c.type === 'flat') return `₹${c.value} off`;
  return 'Free Shipping';
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const CouponFormModal = ({ coupon, onClose, onSave }) => {
  const [form, setForm] = useState(coupon || { code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', usageLimit: '', expiry: '', status: 'active' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h3>{coupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Coupon Code *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="form-input" placeholder="E.g. SUMMER20" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} />
              <button className="btn btn-secondary btn-sm" onClick={() => set('code', Math.random().toString(36).slice(2, 8).toUpperCase())}>Generate</button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Discount Type *</label>
            <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
          {form.type !== 'free_shipping' && (
            <div className="form-group">
              <label className="form-label">{form.type === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'}</label>
              <input className="form-input" type="number" min="0" placeholder="0" value={form.value} onChange={e => set('value', e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Minimum Order (₹)</label>
            <input className="form-input" type="number" min="0" placeholder="0 = No minimum" value={form.minOrder} onChange={e => set('minOrder', e.target.value)} />
          </div>
          {form.type === 'percentage' && (
            <div className="form-group">
              <label className="form-label">Max Discount Cap (₹)</label>
              <input className="form-input" type="number" min="0" placeholder="Leave empty for no cap" value={form.maxDiscount || ''} onChange={e => set('maxDiscount', e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Usage Limit</label>
            <input className="form-input" type="number" min="0" placeholder="Leave empty for unlimited" value={form.usageLimit || ''} onChange={e => set('usageLimit', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input className="form-input" type="date" value={form.expiry} onChange={e => set('expiry', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>{coupon ? 'Update Coupon' : 'Create Coupon'}</button>
        </div>
      </div>
    </div>
  );
};

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'coupons'));
      const couponsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoupons(couponsData);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const filtered = coupons.filter(c => (c.code || '').toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (form) => {
    try {
      if (editCoupon) {
        const couponRef = doc(db, 'coupons', editCoupon.id);
        await updateDoc(couponRef, form);
      } else {
        await addDoc(collection(db, 'coupons'), {
          ...form,
          used: 0,
          categories: [],
          customers: []
        });
      }
      setShowForm(false);
      setEditCoupon(null);
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Failed to save coupon');
    }
  };

  const handleDelete = async (id) => { 
    if (window.confirm('Delete this coupon?')) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
        fetchCoupons();
      } catch (error) {
        console.error('Error deleting coupon:', error);
        alert('Failed to delete coupon');
      }
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const totals = { 
    active: coupons.filter(c => c.status === 'active').length, 
    expired: coupons.filter(c => c.status === 'expired').length, 
    totalUsed: coupons.reduce((a, b) => a + (b.used || 0), 0) 
  };

  return (
    <AdminLayout>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Coupon Management</h1>
            <p className="page-subtitle">Create and manage discount coupons for your store.</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditCoupon(null); setShowForm(true); }}>
            <Plus size={14} /> Create Coupon
          </button>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Active Coupons', value: totals.active, color: '#22C55E' },
            { label: 'Expired Coupons', value: totals.expired, color: '#FF4D4D' },
            { label: 'Total Uses', value: totals.totalUsed, color: '#DFFF1B' },
          ].map((s, i) => (
            <motion.div key={i} className="inv-stat-card" variants={itemVariants}>
              <div className="inv-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="inv-stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <motion.div variants={itemVariants}>
          <div className="search-wrapper" style={{ maxWidth: 320 }}>
            <Search size={16} className="search-icon" />
            <input className="form-input search-input" placeholder="Search coupons..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div className="table-card" variants={itemVariants}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const pct = c.usageLimit ? Math.round((c.used / c.usageLimit) * 100) : null;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <code className="sku-code">{c.code}</code>
                          <button className="btn btn-ghost btn-icon" style={{ padding: '0.2rem' }} onClick={() => copyCode(c.code)} title="Copy">
                            <Copy size={13} />
                          </button>
                          {copied === c.code && <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>Copied!</span>}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          {couponTypeIcon(c.type)} {couponTypeLabel(c.type)}
                        </span>
                      </td>
                      <td><strong>{couponValue(c)}</strong></td>
                      <td>{c.minOrder > 0 ? `₹${c.minOrder}` : 'None'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem' }}>{c.used} {c.usageLimit ? `/ ${c.usageLimit}` : '(unlimited)'}</span>
                          {pct !== null && (
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--error)' : 'var(--primary)' }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.expiry}</td>
                      <td><span className={`badge ${c.status === 'active' ? 'badge-success' : c.status === 'expired' ? 'badge-error' : 'badge-neutral'}`}>{c.status}</span></td>
                      <td>
                        <div className="table-actions">
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditCoupon(c); setShowForm(true); }}><Edit2 size={14} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {(showForm || editCoupon) && (
          <CouponFormModal coupon={editCoupon} onClose={() => { setShowForm(false); setEditCoupon(null); }} onSave={handleSave} />
        )}
      </motion.div>
      <style>{`
        .sku-code { font-family: monospace; font-size: 0.78rem; color: var(--text-muted); background: var(--bg-soft); padding: 0.15rem 0.4rem; border-radius: 4px; }
        .table-actions { display: flex; gap: 0.25rem; }
        .inv-stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; display: flex; gap: 1rem; align-items: center; }
        .inv-stat-value { font-size: 1.5rem; font-weight: 800; font-family: var(--ff-heading); }
        .inv-stat-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
      `}</style>
    </AdminLayout>
  );
};

export default Coupons;

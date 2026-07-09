import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { Bell, Send, Users, User, Tag, Package, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const mockSent = [
  { id: 1, title: 'Summer Sale Live!', body: 'Shop up to 50% off on all summer styles.', segment: 'All Customers', sent: '2026-07-05', reads: 2840, clicks: 412 },
  { id: 2, title: 'Your order has shipped', body: 'Order #ORD-2841 is on its way!', segment: 'Customers with pending orders', sent: '2026-07-04', reads: 156, clicks: 98 },
  { id: 3, title: 'Flash Sale Tonight!', body: 'Midnight flash sale — 40% off for 6 hours only.', segment: 'All Customers', sent: '2026-07-03', reads: 3120, clicks: 620 },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const Notifications = () => {
  const [form, setForm] = useState({ title: '', body: '', segment: 'all', type: 'promotion', scheduled: false, scheduleTime: '' });
  const [sent, setSent] = useState(mockSent);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const SEGMENTS = [
    { value: 'all', label: 'All Customers', icon: Users },
    { value: 'new', label: 'New Customers (last 30 days)', icon: User },
    { value: 'vip', label: 'VIP Customers', icon: Tag },
    { value: 'cart', label: 'Customers with items in cart', icon: ShoppingBag },
    { value: 'order', label: 'Customers with pending orders', icon: Package },
  ];

  const TYPES = [
    { value: 'promotion', label: 'Promotion', color: '#DFFF1B' },
    { value: 'order', label: 'Order Update', color: '#22C55E' },
    { value: 'flash', label: 'Flash Sale', color: '#FF4D4D' },
    { value: 'stock', label: 'Stock Alert', color: '#F59E0B' },
  ];

  return (
    <AdminLayout>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">Send push notifications and emails to customers or specific segments.</p>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
          {/* Send Notification Form */}
          <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="chart-card">
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} /> Create Notification
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Type */}
                <div className="form-group">
                  <label className="form-label">Notification Type</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {TYPES.map(t => (
                      <button
                        key={t.value}
                        className={`notif-type-btn ${form.type === t.value ? 'active' : ''}`}
                        style={{ '--tc': t.color }}
                        onClick={() => set('type', t.value)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Notification Title *</label>
                  <input className="form-input" placeholder="E.g. New arrivals just dropped!" value={form.title} onChange={e => set('title', e.target.value)} />
                </div>

                {/* Body */}
                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea className="form-input" rows={4} placeholder="Write your notification message..." value={form.body} onChange={e => set('body', e.target.value)} style={{ resize: 'vertical' }} />
                  <span className="form-hint">{form.body.length}/160 characters</span>
                </div>

                {/* Segment */}
                <div className="form-group">
                  <label className="form-label">Send To</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {SEGMENTS.map(s => (
                      <label key={s.value} className="radio-wrapper" style={{ padding: '0.6rem 0.75rem', background: form.segment === s.value ? 'var(--primary-light)' : 'var(--bg-soft)', borderRadius: 'var(--radius-sm)', border: `1px solid ${form.segment === s.value ? 'rgba(var(--primary-rgb),0.3)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <input type="radio" name="segment" value={s.value} checked={form.segment === s.value} onChange={e => set('segment', e.target.value)} style={{ width: 14, height: 14 }} />
                        <s.icon size={14} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <label className="checkbox-wrapper">
                  <input type="checkbox" checked={form.scheduled} onChange={e => set('scheduled', e.target.checked)} />
                  Schedule for later
                </label>
                {form.scheduled && (
                  <div className="form-group">
                    <label className="form-label">Schedule Time</label>
                    <input className="form-input" type="datetime-local" value={form.scheduleTime} onChange={e => set('scheduleTime', e.target.value)} />
                  </div>
                )}

                {/* Preview */}
                {(form.title || form.body) && (
                  <div className="notif-preview">
                    <div className="notif-preview-header"><Bell size={14} /> Preview</div>
                    <div className="notif-preview-card">
                      <div className="notif-preview-app">Retrostylings</div>
                      <div className="notif-preview-title">{form.title || 'Notification title'}</div>
                      <div className="notif-preview-body">{form.body || 'Your message here'}</div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }}>Save Draft</button>
                  <button className="btn btn-primary" style={{ flex: 1 }}>
                    <Send size={14} /> {form.scheduled ? 'Schedule' : 'Send Now'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sent History */}
          <motion.div variants={itemVariants}>
            <div className="chart-card" style={{ height: '100%' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Sent Notifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sent.map(n => (
                  <div key={n.id} className="notif-history-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.875rem' }}>{n.title}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{n.sent}</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{n.body}</p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>To: <strong>{n.segment}</strong></span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem' }}>👁 {n.reads.toLocaleString()} reads</span>
                      <span style={{ fontSize: '0.72rem' }}>🖱 {n.clicks} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <style>{`
        .chart-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; }
        .notif-type-btn { padding: 0.4rem 0.9rem; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 600; border: 1px solid var(--border); background: var(--bg-soft); color: var(--text-muted); cursor: pointer; transition: all 0.15s; }
        .notif-type-btn:hover { border-color: var(--tc); color: var(--tc); }
        .notif-type-btn.active { background: color-mix(in srgb, var(--tc) 12%, transparent); border-color: var(--tc); color: var(--tc); }
        .notif-preview { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
        .notif-preview-header { background: var(--bg-soft); padding: 0.5rem 0.75rem; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 0.4rem; }
        .notif-preview-card { background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 0.75rem 1rem; margin: 0.75rem; }
        .notif-preview-app { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem; }
        .notif-preview-title { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }
        .notif-preview-body { font-size: 0.78rem; color: var(--text-dim); margin-top: 0.2rem; }
        .notif-history-item { padding: 1rem; background: var(--bg-soft); border-radius: var(--radius-sm); border: 1px solid var(--border); }
      `}</style>
    </AdminLayout>
  );
};

export default Notifications;

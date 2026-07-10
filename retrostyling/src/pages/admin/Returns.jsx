import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, Eye, Check, X, Truck, DollarSign, Filter,
  Package, User, Calendar, ArrowRight, AlertCircle, Image as ImageIcon
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { returnService } from '../../services/firestoreService';
import './Returns.css';

const STATUS_TABS = [
  { key: 'all',               label: 'All' },
  { key: 'pending',           label: 'Pending' },
  { key: 'approved',          label: 'Approved' },
  { key: 'pickup_scheduled',  label: 'Pickup' },
  { key: 'received',          label: 'Received' },
  { key: 'refund_initiated',  label: 'Refund Initiated' },
  { key: 'refund_completed',  label: 'Completed' },
  { key: 'rejected',          label: 'Rejected' },
];

const RETURN_STATUS_STEPS = [
  'pending',
  'approved',
  'pickup_scheduled',
  'received',
  'refund_initiated',
  'refund_completed',
];

const STEP_LABELS = {
  pending:           'Return Requested',
  approved:          'Approved',
  pickup_scheduled:  'Pickup Scheduled',
  received:          'Product Received',
  refund_initiated:  'Refund Initiated',
  refund_completed:  'Refund Completed',
  rejected:          'Rejected',
};

const formatDate = (ts) => {
  if (!ts) return 'N/A';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const StatusBadge = ({ status }) => {
  const map = {
    pending:          { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    approved:         { color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    pickup_scheduled: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    received:         { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
    refund_initiated: { color: '#DFFF1B', bg: 'rgba(223,255,27,0.1)' },
    refund_completed: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    rejected:         { color: '#FF4D4D', bg: 'rgba(255,77,77,0.12)' },
  };
  const s = map[status] || { color: '#aaa', bg: 'rgba(255,255,255,0.05)' };
  return (
    <span className="ret-badge" style={{ color: s.color, background: s.bg }}>
      {STEP_LABELS[status] || status}
    </span>
  );
};

const ReturnDetailModal = ({ ret, onClose, onUpdateStatus }) => {
  const [updatingTo, setUpdatingTo] = useState(null);

  if (!ret) return null;

  const currentIdx = RETURN_STATUS_STEPS.indexOf(ret.status);

  const handleAction = async (newStatus) => {
    setUpdatingTo(newStatus);
    try {
      await onUpdateStatus(ret.id, newStatus);
    } finally {
      setUpdatingTo(null);
    }
  };

  return (
    <div className="ret-modal-overlay" onClick={onClose}>
      <motion.div
        className="ret-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="ret-modal-header">
          <div>
            <h2>Return #{ret.id.slice(-8).toUpperCase()}</h2>
            <p>Order #{ret.orderId?.slice(-8).toUpperCase()}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusBadge status={ret.status} />
            <button className="ret-modal-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="ret-modal-body">
          {/* Progress */}
          {ret.status !== 'rejected' && (
            <div className="ret-progress">
              {RETURN_STATUS_STEPS.map((step, i) => (
                <div key={step} className="ret-prog-step">
                  <div className={`ret-prog-dot ${i <= currentIdx ? 'done' : ''} ${i === currentIdx ? 'current' : ''}`} />
                  <span className={i <= currentIdx ? 'done' : ''}>{STEP_LABELS[step]}</span>
                  {i < RETURN_STATUS_STEPS.length - 1 && (
                    <div className={`ret-prog-line ${i < currentIdx ? 'done' : ''}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info Grid */}
          <div className="ret-info-grid">
            <div className="ret-info-item">
              <User size={14} />
              <div>
                <span className="ret-info-label">Customer</span>
                <span className="ret-info-val">{ret.customerName}</span>
                <span className="ret-info-sub">{ret.customerEmail}</span>
              </div>
            </div>
            <div className="ret-info-item">
              <Package size={14} />
              <div>
                <span className="ret-info-label">Product</span>
                <span className="ret-info-val">{ret.productName}</span>
              </div>
            </div>
            <div className="ret-info-item">
              <AlertCircle size={14} />
              <div>
                <span className="ret-info-label">Return Reason</span>
                <span className="ret-info-val">{ret.reason}</span>
              </div>
            </div>
            <div className="ret-info-item">
              <Calendar size={14} />
              <div>
                <span className="ret-info-label">Requested On</span>
                <span className="ret-info-val">{formatDate(ret.createdAt)}</span>
              </div>
            </div>
          </div>

          {ret.description && (
            <div className="ret-description">
              <h4>Customer Description</h4>
              <p>{ret.description}</p>
            </div>
          )}

          {ret.images && ret.images.length > 0 && (
            <div className="ret-images">
              <h4><ImageIcon size={14} /> Uploaded Images</h4>
              <div className="ret-images-grid">
                {ret.images.map((img, i) => (
                  <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                    <img src={img} alt={`Return image ${i + 1}`} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {ret.status !== 'rejected' && ret.status !== 'refund_completed' && (
            <div className="ret-actions">
              <h4>Update Status</h4>
              <div className="ret-action-btns">
                {ret.status === 'pending' && (
                  <>
                    <button
                      className="ret-btn ret-btn--approve"
                      onClick={() => handleAction('approved')}
                      disabled={!!updatingTo}
                    >
                      <Check size={16} /> {updatingTo === 'approved' ? 'Approving...' : 'Approve Return'}
                    </button>
                    <button
                      className="ret-btn ret-btn--reject"
                      onClick={() => handleAction('rejected')}
                      disabled={!!updatingTo}
                    >
                      <X size={16} /> {updatingTo === 'rejected' ? 'Rejecting...' : 'Reject Return'}
                    </button>
                  </>
                )}
                {ret.status === 'approved' && (
                  <button
                    className="ret-btn ret-btn--pickup"
                    onClick={() => handleAction('pickup_scheduled')}
                    disabled={!!updatingTo}
                  >
                    <Truck size={16} /> {updatingTo === 'pickup_scheduled' ? 'Scheduling...' : 'Schedule Pickup'}
                  </button>
                )}
                {ret.status === 'pickup_scheduled' && (
                  <button
                    className="ret-btn ret-btn--received"
                    onClick={() => handleAction('received')}
                    disabled={!!updatingTo}
                  >
                    <Package size={16} /> {updatingTo === 'received' ? 'Marking...' : 'Mark as Received'}
                  </button>
                )}
                {ret.status === 'received' && (
                  <button
                    className="ret-btn ret-btn--refund"
                    onClick={() => handleAction('refund_initiated')}
                    disabled={!!updatingTo}
                  >
                    <DollarSign size={16} /> {updatingTo === 'refund_initiated' ? 'Initiating...' : 'Initiate Refund'}
                  </button>
                )}
                {ret.status === 'refund_initiated' && (
                  <button
                    className="ret-btn ret-btn--complete"
                    onClick={() => handleAction('refund_completed')}
                    disabled={!!updatingTo}
                  >
                    <Check size={16} /> {updatingTo === 'refund_completed' ? 'Completing...' : 'Complete Refund'}
                  </button>
                )}
              </div>
            </div>
          )}
          {(ret.status === 'rejected' || ret.status === 'refund_completed') && (
            <div className={`ret-final-badge ${ret.status === 'rejected' ? 'rejected' : 'completed'}`}>
              {ret.status === 'rejected' ? (
                <><X size={16} /> This return request has been rejected.</>
              ) : (
                <><Check size={16} /> Refund has been completed successfully.</>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const AdminReturns = () => {
  const [returns, setReturns]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('all');
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await returnService.getAll();
      setReturns(data);
    } catch (err) {
      console.error(err);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (returnId, newStatus) => {
    await returnService.updateStatus(returnId, newStatus);
    setReturns(prev => prev.map(r => r.id === returnId ? { ...r, status: newStatus } : r));
    if (selected?.id === returnId) setSelected(prev => ({ ...prev, status: newStatus }));
  };

  const filtered = activeTab === 'all'
    ? returns
    : returns.filter(r => r.status === activeTab);

  const counts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === 'all' ? returns.length : returns.filter(r => r.status === tab.key).length;
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="admin-header-actions">
        <div>
          <h2>Return Management</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {returns.length} total return requests
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadReturns}>
          <RotateCcw size={15} /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="ret-tabs">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            className={`ret-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {counts[tab.key] > 0 && <span className="ret-tab-count">{counts[tab.key]}</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Request Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="ret-loading">
                  <div className="ret-spinner" />
                  <span>Loading returns...</span>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No returns found for this filter.
              </td></tr>
            ) : filtered.map(ret => (
              <tr key={ret.id}>
                <td>
                  <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    #{ret.id.slice(-8).toUpperCase()}
                  </code>
                </td>
                <td>
                  <code style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    #{ret.orderId?.slice(-8).toUpperCase()}
                  </code>
                </td>
                <td>
                  <div>
                    <strong>{ret.customerName}</strong>
                    <br />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{ret.customerEmail}</small>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {ret.productImage && (
                      <img
                        src={ret.productImage}
                        alt={ret.productName}
                        style={{ width: 36, height: 44, objectFit: 'cover', borderRadius: 6, background: 'var(--bg-soft)', flexShrink: 0 }}
                      />
                    )}
                    <span style={{ fontSize: '0.875rem' }}>{ret.productName}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>{ret.reason}</td>
                <td><StatusBadge status={ret.status} /></td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(ret.createdAt)}</td>
                <td>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <button
                      className="ret-icon-btn"
                      onClick={() => setSelected(ret)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {ret.status === 'pending' && (
                      <>
                        <button
                          className="ret-icon-btn ret-icon-btn--ok"
                          onClick={() => handleUpdateStatus(ret.id, 'approved')}
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="ret-icon-btn ret-icon-btn--err"
                          onClick={() => handleUpdateStatus(ret.id, 'rejected')}
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    {ret.status === 'approved' && (
                      <button
                        className="ret-icon-btn ret-icon-btn--info"
                        onClick={() => handleUpdateStatus(ret.id, 'pickup_scheduled')}
                        title="Schedule Pickup"
                      >
                        <Truck size={16} />
                      </button>
                    )}
                    {ret.status === 'received' && (
                      <button
                        className="ret-icon-btn ret-icon-btn--primary"
                        onClick={() => handleUpdateStatus(ret.id, 'refund_initiated')}
                        title="Initiate Refund"
                      >
                        <DollarSign size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <ReturnDetailModal
            ret={selected}
            onClose={() => setSelected(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminReturns;

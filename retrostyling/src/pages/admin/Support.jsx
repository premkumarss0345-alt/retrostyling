import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Mail, Phone, Calendar, CheckCircle, Clock,
  ArrowRight, Search, Eye, X, Send, RotateCcw, Reply, ShieldAlert
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { contactService } from '../../services/firestoreService';
import './Support.css';

const FILTER_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'new',       label: 'New/Unresolved' },
  { key: 'responded', label: 'Responded' },
];

const formatDate = (ts) => {
  if (!ts) return 'N/A';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const Support = () => {
  const [inquiries, setInquiries]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('all');
  const [searchVal, setSearchVal]   = useState('');
  const [selected, setSelected]     = useState(null);
  const [replyText, setReplyText]   = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const data = await contactService.getAll();
      setInquiries(data);
    } catch (err) {
      console.error(err);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selected || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await contactService.respond(selected.id, replyText.trim());
      // Update local state
      setInquiries(prev => prev.map(inq => inq.id === selected.id ? { ...inq, status: 'responded', response: replyText.trim() } : inq));
      setSelected(prev => ({ ...prev, status: 'responded', response: replyText.trim() }));
      setReplyText('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit reply');
    } finally {
      setSendingReply(false);
    }
  };

  const filtered = inquiries
    .filter(inq => {
      if (activeTab === 'all') return true;
      return inq.status === activeTab;
    })
    .filter(inq => {
      if (!searchVal.trim()) return true;
      const s = searchVal.toLowerCase();
      return (
        inq.name?.toLowerCase().includes(s) ||
        inq.email?.toLowerCase().includes(s) ||
        inq.subject?.toLowerCase().includes(s) ||
        inq.message?.toLowerCase().includes(s)
      );
    });

  const counts = {
    all: inquiries.length,
    new: inquiries.filter(i => i.status === 'new').length,
    responded: inquiries.filter(i => i.status === 'responded').length,
  };

  return (
    <AdminLayout>
      <div className="admin-header-actions">
        <div>
          <h2>Contact & Support</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Manage and respond to customer queries and feedback
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search inquiries..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              className="supp-search-input"
            />
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadInquiries} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RotateCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="supp-tabs">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            className={`supp-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {counts[tab.key] > 0 && <span className="supp-tab-count">{counts[tab.key]}</span>}
          </button>
        ))}
      </div>

      {/* Table List */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Subject</th>
              <th>Message Preview</th>
              <th>Status</th>
              <th>Date Received</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                  <div className="supp-spinner" />
                  <span>Loading inquiries...</span>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No inquiries found.
              </td></tr>
            ) : filtered.map(inq => (
              <tr key={inq.id} className={inq.status === 'new' ? 'row-unread' : ''}>
                <td>
                  <div>
                    <strong>{inq.name || 'Anonymous'}</strong>
                    <br />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{inq.email}</small>
                  </div>
                </td>
                <td style={{ fontWeight: inq.status === 'new' ? 700 : 400 }}>{inq.subject}</td>
                <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  {inq.message}
                </td>
                <td>
                  <span className={`supp-status-badge status-${inq.status}`}>
                    {inq.status === 'new' ? 'New Inquiry' : 'Responded'}
                  </span>
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(inq.createdAt)}</td>
                <td>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <button
                      className="supp-action-btn"
                      onClick={() => setSelected(inq)}
                      title="View & Reply"
                    >
                      <Eye size={16} />
                      <span>{inq.status === 'new' ? 'Reply' : 'View'}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {selected && (
          <div className="supp-modal-overlay" onClick={() => setSelected(null)}>
            <motion.div
              className="supp-modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="supp-modal-header">
                <div>
                  <h3>Customer Inquiry</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    ID: #{selected.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <button className="supp-modal-close" onClick={() => setSelected(null)}><X size={20} /></button>
              </div>

              <div className="supp-modal-body">
                {/* Customer Details */}
                <div className="supp-detail-card">
                  <div className="supp-detail-row">
                    <span className="label">From:</span>
                    <strong>{selected.name}</strong>
                  </div>
                  <div className="supp-detail-row">
                    <span className="label">Email:</span>
                    <a href={`mailto:${selected.email}`} className="text-primary">{selected.email}</a>
                  </div>
                  <div className="supp-detail-row">
                    <span className="label">Date:</span>
                    <span>{formatDate(selected.createdAt)}</span>
                  </div>
                  <div className="supp-detail-row">
                    <span className="label">Subject:</span>
                    <span style={{ fontWeight: 700 }}>{selected.subject}</span>
                  </div>
                </div>

                {/* Message Box */}
                <div className="supp-msg-box">
                  <h4>Message</h4>
                  <p>{selected.message}</p>
                </div>

                {/* Response / Reply Box */}
                {selected.status === 'responded' ? (
                  <div className="supp-response-box">
                    <h4 style={{ color: 'var(--success)' }}>✔ Response Sent</h4>
                    <p>{selected.response}</p>
                    {selected.respondedAt && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                        Replied on {formatDate(selected.respondedAt)}
                      </span>
                    )}
                  </div>
                ) : (
                  <form className="supp-reply-form" onSubmit={handleSendReply}>
                    <h4>Send Response</h4>
                    <textarea
                      placeholder="Write your email response here..."
                      rows={5}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      required
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                      <button type="submit" className="btn btn-primary" disabled={sendingReply}>
                        <Send size={14} />
                        {sendingReply ? 'Sending...' : 'Send Response'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default Support;

import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { reviewService } from '../../services/firestoreService';
import { Star, Check, X, MessageSquare, Search, ThumbsUp, Flag, RefreshCw, Trash2, Clock } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const StarRating = ({ rating }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={13} fill={i <= rating ? '#F59E0B' : 'transparent'} color={i <= rating ? '#F59E0B' : 'var(--text-faint)'} />
    ))}
  </div>
);

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await reviewService.getAll();
      setReviews(data);
    } catch (err) {
      console.error('Reviews load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await reviewService.updateStatus(id, status);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      console.error(err);
      alert('Failed to update review status');
    }
  };

  const handleReply = async (id) => {
    try {
      await reviewService.addReply(id, replyText);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, reply: replyText } : r));
      setReplyTarget(null);
      setReplyText('');
    } catch (err) {
      console.error(err);
      alert('Failed to save reply');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await reviewService.delete(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete review');
    }
  };

  const filtered = reviews.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch =
      (r.product || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.customer || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    pending:  reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
    flagged:  reviews.filter(r => r.status === 'flagged').length,
  };

  const statusStyle = (status) => ({
    padding: '0.35rem 0.6rem',
    borderRadius: '100px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background:
      status === 'pending'  ? 'rgba(245, 158, 11, 0.15)' :
      status === 'approved' ? 'rgba(34, 197, 94, 0.15)'  :
      status === 'flagged'  ? 'rgba(139, 92, 246, 0.15)' :
                              'rgba(255, 77, 77, 0.15)',
    color:
      status === 'pending'  ? '#FBBF24' :
      status === 'approved' ? '#4ADE80' :
      status === 'flagged'  ? '#A78BFA' :
                              '#F87171',
    border:
      status === 'pending'  ? '1px solid rgba(245, 158, 11, 0.3)' :
      status === 'approved' ? '1px solid rgba(34, 197, 94, 0.3)'  :
      status === 'flagged'  ? '1px solid rgba(139, 92, 246, 0.3)' :
                              '1px solid rgba(255, 77, 77, 0.3)',
  });

  return (
    <AdminLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        {/* Page Header */}
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Review Management</h1>
            <p className="page-subtitle">Moderate customer reviews, approve, reject, or reply to feedback.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Pending',  value: counts.pending,  color: '#F59E0B' },
            { label: 'Approved', value: counts.approved, color: '#22C55E' },
            { label: 'Rejected', value: counts.rejected, color: '#FF4D4D' },
            { label: 'Flagged',  value: counts.flagged,  color: '#8B5CF6' },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="inv-stat-card"
              variants={itemVariants}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilter(s.label.toLowerCase())}
            >
              <div className="inv-stat-value" style={{ color: s.color }}>{loading ? '...' : s.value}</div>
              <div className="inv-stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrapper" style={{ maxWidth: 320 }}>
            <Search size={16} className="search-icon" />
            <input
              className="form-input search-input"
              placeholder="Search by product or customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="period-tabs">
            {['all', 'pending', 'approved', 'rejected', 'flagged'].map(f => (
              <button
                key={f}
                className={`period-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Review Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              Loading reviews...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '1.1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
              No reviews found.
            </div>
          ) : filtered.map(review => (
            <motion.div
              key={review.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transition: 'transform 0.2s',
              }}
            >
              {/* Card Header */}
              <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-main)', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
                    {(review.customer || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--white)', fontWeight: '600' }}>{review.customer}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-light)' }}>
                      on <strong style={{ color: 'var(--white)' }}>{review.product}</strong>
                    </p>
                  </div>
                </div>
                <span style={statusStyle(review.status)}>{review.status}</span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <StarRating rating={review.rating} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} /> {review.date}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--white)', fontWeight: '600', lineHeight: 1.3 }}>{review.title}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>{review.body}</p>

                {review.reply && (
                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(223,255,27,0.05)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                    <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Developer Reply:</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--white)', lineHeight: 1.5 }}>{review.reply}</p>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: replyTarget === review.id ? '1rem' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <ThumbsUp size={14} />
                    <span style={{ fontWeight: '500' }}>{review.helpful || 0}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {review.status !== 'approved' && (
                      <button title="Approve" onClick={() => updateStatus(review.id, 'approved')} style={{ background: 'rgba(34, 197, 94, 0.1)', border: 'none', padding: '0.4rem', borderRadius: '6px', color: '#4ADE80', cursor: 'pointer' }}>
                        <Check size={16} />
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button title="Reject" onClick={() => updateStatus(review.id, 'rejected')} style={{ background: 'rgba(255, 77, 77, 0.1)', border: 'none', padding: '0.4rem', borderRadius: '6px', color: '#F87171', cursor: 'pointer' }}>
                        <X size={16} />
                      </button>
                    )}
                    {review.status !== 'flagged' && (
                      <button title="Flag" onClick={() => updateStatus(review.id, 'flagged')} style={{ background: 'rgba(139, 92, 246, 0.1)', border: 'none', padding: '0.4rem', borderRadius: '6px', color: '#A78BFA', cursor: 'pointer' }}>
                        <Flag size={16} />
                      </button>
                    )}
                    <button title="Reply" onClick={() => setReplyTarget(replyTarget === review.id ? null : review.id)} style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', padding: '0.4rem', borderRadius: '6px', color: 'var(--white)', cursor: 'pointer' }}>
                      <MessageSquare size={16} />
                    </button>
                    <button title="Delete" onClick={() => handleDelete(review.id)} style={{ background: 'transparent', border: '1px dashed rgba(255, 77, 77, 0.3)', padding: '0.4rem', borderRadius: '6px', color: '#F87171', cursor: 'pointer', marginLeft: '0.5rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Reply Editor */}
                {replyTarget === review.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <textarea
                      rows={3}
                      placeholder="Write a public reply..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem', color: 'var(--white)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', marginBottom: '0.75rem', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button onClick={() => setReplyTarget(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                      <button onClick={() => handleReply(review.id)} style={{ background: 'var(--primary)', border: 'none', color: 'var(--bg-main)', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}>Submit Reply</button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default Reviews;

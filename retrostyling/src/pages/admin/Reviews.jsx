import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { reviewService } from '../../services/firestoreService';
import { Star, Check, X, MessageSquare, Eye, Search, Filter, ThumbsUp, ThumbsDown, Flag, RefreshCw } from 'lucide-react';
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

  const filtered = reviews.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = (r.product || '').toLowerCase().includes(search.toLowerCase()) || (r.customer || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
    flagged: reviews.filter(r => r.status === 'flagged').length
  };

  return (
    <AdminLayout>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Review Management</h1>
            <p className="page-subtitle">Moderate customer reviews, approve, reject, or reply to feedback.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadData}><RefreshCw size={14} /> Refresh</button>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Pending', value: counts.pending, color: '#F59E0B' },
            { label: 'Approved', value: counts.approved, color: '#22C55E' },
            { label: 'Rejected', value: counts.rejected, color: '#FF4D4D' },
            { label: 'Flagged', value: counts.flagged, color: '#8B5CF6' },
          ].map((s, i) => (
            <motion.div key={i} className="inv-stat-card" variants={itemVariants} style={{ cursor: 'pointer' }} onClick={() => setFilter(s.label.toLowerCase())}>
              <div className="inv-stat-value" style={{ color: s.color }}>{loading ? '...' : s.value}</div>
              <div className="inv-stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrapper" style={{ maxWidth: 320 }}>
            <Search size={16} className="search-icon" />
            <input className="form-input search-input" placeholder="Search by product or customer..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="period-tabs">
            {['all', 'pending', 'approved', 'rejected', 'flagged'].map(f => (
              <button key={f} className={`period-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Review Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading reviews...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No reviews found.</div>
          ) : filtered.map(review => (
            <motion.div key={review.id} className="review-card" variants={itemVariants}>
              <div className="review-header">
                <div className="review-customer">
                  <div className="review-avatar">{(review.customer || 'C').charAt(0)}</div>
                  <div>
                    <p className="review-name">{review.customer}</p>
                    <p className="review-product">{review.product}</p>
                  </div>
                </div>
                <div className="review-meta">
                  <StarRating rating={review.rating} />
                  <span className="review-date">{review.date}</span>
                  <span className={`badge ${review.status === 'pending' ? 'badge-warning' : review.status === 'approved' ? 'badge-success' : review.status === 'flagged' ? 'badge-secondary' : 'badge-error'}`}>
                    {review.status}
                  </span>
                </div>
              </div>
              <div className="review-body">
                <h4 className="review-title">{review.title}</h4>
                <p className="review-text">{review.body}</p>
                {review.reply && (
                  <div className="review-reply-box">
                    <strong>Developer Reply:</strong>
                    <p>{review.reply}</p>
                  </div>
                )}
              </div>
              <div className="review-actions">
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  <span><ThumbsUp size={13} /> {review.helpful || 0} helpful</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {review.status !== 'approved' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(review.id, 'approved')}><Check size={13} /> Approve</button>
                  )}
                  {review.status !== 'rejected' && (
                    <button className="btn btn-outline btn-sm text-red" onClick={() => updateStatus(review.id, 'rejected')}><X size={13} /> Reject</button>
                  )}
                  {review.status !== 'flagged' && (
                    <button className="btn btn-outline btn-sm" onClick={() => updateStatus(review.id, 'flagged')}><Flag size={13} /> Flag</button>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={() => setReplyTarget(replyTarget === review.id ? null : review.id)}><MessageSquare size={13} /> Reply</button>
                </div>
              </div>
              {replyTarget === review.id && (
                <div className="reply-editor" style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <textarea className="form-input" rows={3} placeholder="Write a public reply..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ resize: 'vertical', width: '100%', marginBottom: '0.5rem' }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setReplyTarget(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleReply(review.id)}>Submit Reply</button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default Reviews;

import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import {
  Megaphone, Tag, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  Eye, RefreshCw, ExternalLink, ArrowRight, Sparkles, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { announcementService, promoBannerService } from '../../services/firestoreService';
import Toast from '../../components/Toast';
import './Promotions.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 }
};

const SUGGESTED_EMOJIS = ['🎉', '🔥', '🚀', '✨', '⚡', '💥', '🏷️', '💎', '⭐', '📦'];

// ─── ANNOUNCEMENT MODAL ──────────────────────────────────────────────────────
const AnnouncementModal = ({ announcement, onClose, onSave }) => {
  const [form, setForm] = useState(
    announcement || {
      text: '',
      link: '',
      active: true,
      order: 0,
    }
  );

  const addEmoji = (emoji) => {
    setForm((prev) => ({ ...prev, text: `${emoji} ${prev.text}`.trim() }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h3>{announcement ? 'Edit Announcement' : 'Add New Announcement'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.text.trim()) return alert('Please enter notice text');
            onSave(form);
          }}
        >
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div className="form-group">
              <label className="form-label">Notice Message *</label>
              <input
                className="form-input"
                placeholder="e.g. 🎉 FREE SHIPPING ON ALL ORDERS ABOVE ₹999"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                required
              />
              <div style={{ marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick add icon: </span>
                <div className="emoji-chips">
                  {SUGGESTED_EMOJIS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      className="emoji-chip-btn"
                      onClick={() => addEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Link URL (Optional)</label>
              <input
                className="form-input"
                placeholder="/shop or /category/casual"
                value={form.link || ''}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Optional link when a customer clicks the notice ticker.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Display Order</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label className="checkbox-wrapper" style={{ marginTop: '1.25rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  <span>Active (Live in Ticker)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {announcement ? 'Update Notice' : 'Add Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── PROMO BANNER MODAL ──────────────────────────────────────────────────────
const PromoBannerModal = ({ banner, onClose, onSave }) => {
  const [form, setForm] = useState(
    banner || {
      badgeText: 'LIMITED TIME OFFER',
      title: 'Summer Collection',
      highlightText: 'Up to 40% OFF',
      description: 'Use code SUMMER40 at checkout. Limited stock available.',
      couponCode: 'SUMMER40',
      btnText: 'Shop Now',
      btnLink: '/shop',
      active: true,
      order: 0,
    }
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3>{banner ? 'Edit Promo Banner' : 'Create Promo Banner'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim()) return alert('Please enter banner title');
            onSave(form);
          }}
        >
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Badge Label</label>
                <input
                  className="form-input"
                  placeholder="e.g. LIMITED TIME OFFER"
                  value={form.badgeText || ''}
                  onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Coupon / Promo Code</label>
                <input
                  className="form-input"
                  placeholder="e.g. SUMMER40"
                  value={form.couponCode || ''}
                  onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Main Heading *</label>
              <input
                className="form-input"
                placeholder="e.g. Summer Collection"
                value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Highlight Text (Neon Colored)</label>
              <input
                className="form-input"
                placeholder="e.g. Up to 40% OFF"
                value={form.highlightText || ''}
                onChange={(e) => setForm({ ...form, highlightText: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description Text</label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="e.g. Use code SUMMER40 at checkout. Limited stock available."
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Button Text</label>
                <input
                  className="form-input"
                  placeholder="e.g. Shop Now"
                  value={form.btnText || ''}
                  onChange={(e) => setForm({ ...form, btnText: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Button Link</label>
                <input
                  className="form-input"
                  placeholder="e.g. /shop"
                  value={form.btnLink || ''}
                  onChange={(e) => setForm({ ...form, btnLink: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Display Order</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label className="checkbox-wrapper" style={{ marginTop: '1.25rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  <span>Active (Display on Homepage)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {banner ? 'Update Banner' : 'Create Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MAIN ADMIN PROMOTIONS COMPONENT ─────────────────────────────────────────
const AdminPromotions = () => {
  const [activeTab, setActiveTab] = useState('notices'); // 'notices' | 'promo'
  const [announcements, setAnnouncements] = useState([]);
  const [promoBanners, setPromoBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewNoticeIdx, setPreviewNoticeIdx] = useState(0);

  // Modals
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  // Notice ticker preview interval
  useEffect(() => {
    const activeNotices = announcements.filter((a) => a.active !== false);
    if (activeNotices.length <= 1) return;
    const timer = setInterval(() => {
      setPreviewNoticeIdx((prev) => (prev + 1) % activeNotices.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [announcements]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [annData, promoData] = await Promise.all([
        announcementService.getAll(),
        promoBannerService.getAll(),
      ]);
      setAnnouncements(annData);
      setPromoBanners(promoData);
    } catch (err) {
      console.error('Error loading promotions data:', err);
      setToast({ show: true, message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ── Notice Actions ──
  const handleSaveNotice = async (formData) => {
    try {
      if (editingNotice) {
        await announcementService.update(editingNotice.id, formData);
        setToast({ show: true, message: 'Announcement updated!', type: 'success' });
      } else {
        await announcementService.create(formData);
        setToast({ show: true, message: 'Announcement created!', type: 'success' });
      }
      setShowNoticeModal(false);
      setEditingNotice(null);
      await loadAllData();
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to save notice', type: 'error' });
    }
  };

  const handleToggleNotice = async (notice) => {
    try {
      const newStatus = !notice.active;
      await announcementService.update(notice.id, { active: newStatus });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === notice.id ? { ...a, active: newStatus } : a))
      );
      setToast({
        show: true,
        message: `Notice ${newStatus ? 'activated' : 'deactivated'}`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to update status', type: 'error' });
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementService.delete(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setToast({ show: true, message: 'Notice deleted', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to delete notice', type: 'error' });
    }
  };

  const handleSeedNotices = async () => {
    if (!window.confirm('Load 4 default RetroStylings announcement notices?')) return;
    try {
      await announcementService.seedDefaults();
      await loadAllData();
      setToast({ show: true, message: 'Default notices loaded successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to load defaults', type: 'error' });
    }
  };

  // ── Promo Banner Actions ──
  const handleSavePromo = async (formData) => {
    try {
      if (editingPromo) {
        await promoBannerService.update(editingPromo.id, formData);
        setToast({ show: true, message: 'Promo banner updated!', type: 'success' });
      } else {
        await promoBannerService.create(formData);
        setToast({ show: true, message: 'Promo banner created!', type: 'success' });
      }
      setShowPromoModal(false);
      setEditingPromo(null);
      await loadAllData();
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to save promo banner', type: 'error' });
    }
  };

  const handleTogglePromo = async (promo) => {
    try {
      const newStatus = !promo.active;
      await promoBannerService.update(promo.id, { active: newStatus });
      setPromoBanners((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, active: newStatus } : p))
      );
      setToast({
        show: true,
        message: `Promo banner ${newStatus ? 'activated' : 'deactivated'}`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to update status', type: 'error' });
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm('Delete this promo banner?')) return;
    try {
      await promoBannerService.delete(id);
      setPromoBanners((prev) => prev.filter((p) => p.id !== id));
      setToast({ show: true, message: 'Promo banner deleted', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to delete banner', type: 'error' });
    }
  };

  const handleSeedPromo = async () => {
    if (!window.confirm('Load default Summer Collection promo banner?')) return;
    try {
      await promoBannerService.seedDefaults();
      await loadAllData();
      setToast({ show: true, message: 'Default promo banner created!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to create promo banner', type: 'error' });
    }
  };

  // Preview Active Promo Banner
  const activePromoBanner = promoBanners.find((p) => p.active !== false) || null;

  const activeNoticesList = announcements.filter((a) => a.active !== false);
  const currentPreviewNotice =
    activeNoticesList.length > 0
      ? activeNoticesList[previewNoticeIdx % activeNoticesList.length]?.text
      : null;

  return (
    <AdminLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <motion.div
        className="promotions-admin"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Promotions & Notice Bar</h1>
            <p className="page-subtitle">
              Manage the top ticker announcement notices and homepage promotional offer banners.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {activeTab === 'notices' ? (
              <>
                {announcements.length === 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={handleSeedNotices}>
                    <RefreshCw size={14} /> Restore Defaults
                  </button>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingNotice(null);
                    setShowNoticeModal(true);
                  }}
                >
                  <Plus size={15} /> Add Notice
                </button>
              </>
            ) : (
              <>
                {promoBanners.length === 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={handleSeedPromo}>
                    <RefreshCw size={14} /> Restore Default Promo
                  </button>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingPromo(null);
                    setShowPromoModal(true);
                  }}
                >
                  <Plus size={15} /> Add Promo Banner
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div variants={itemVariants}>
          <div className="promo-tabs">
            <button
              className={`promo-tab-btn ${activeTab === 'notices' ? 'active' : ''}`}
              onClick={() => setActiveTab('notices')}
            >
              <Megaphone size={16} /> Top Notice Bar (Ticker)
            </button>
            <button
              className={`promo-tab-btn ${activeTab === 'promo' ? 'active' : ''}`}
              onClick={() => setActiveTab('promo')}
            >
              <Tag size={16} /> Homepage Promo Banner
            </button>
          </div>
        </motion.div>

        {/* ── TAB 1: NOTICES TICKER ── */}
        {activeTab === 'notices' && (
          <motion.div
            key="tab-notices"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {/* Live Interactive Preview */}
            <div className="preview-card">
              <div className="preview-header">
                <div className="preview-title">
                  <Eye size={15} /> Storefront Live Notice Preview
                </div>
                <div className="live-badge">
                  <span className="live-pulse"></span>
                  {activeNoticesList.length} Active in rotation
                </div>
              </div>
              <div
                className="simulated-notice-bar"
                style={!currentPreviewNotice ? { background: '#1c1c24', color: '#7c7c8a', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'none' } : {}}
              >
                {currentPreviewNotice ? (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentPreviewNotice}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentPreviewNotice}
                    </motion.span>
                  </AnimatePresence>
                ) : (
                  <span>No active notice. Click "+ Add Notice" below to show an announcement ticker.</span>
                )}
              </div>
            </div>

            {/* Announcements List */}
            <div className="items-table-card">
              <div className="items-table-header">
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                  Active & Scheduled Notices ({announcements.length})
                </h3>
                {announcements.length > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleSeedNotices}
                    title="Load default notices"
                  >
                    <RefreshCw size={13} /> Reset to Defaults
                  </button>
                )}
              </div>

              {loading ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading notices...
                </div>
              ) : announcements.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                  <Megaphone size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    No announcements configured yet.
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Click below to populate the standard announcement notices.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={handleSeedNotices}>
                    Load 4 Default Notices
                  </button>
                </div>
              ) : (
                <div className="items-list">
                  {announcements.map((notice) => (
                    <div key={notice.id} className="item-row">
                      <div className="item-main">
                        <span className="item-order-badge">#{notice.order || 0}</span>
                        <div>
                          <div className="item-text">{notice.text}</div>
                          {notice.link && (
                            <div className="item-link">
                              <ExternalLink size={11} /> {notice.link}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="item-actions">
                        <button
                          className="toggle-btn"
                          onClick={() => handleToggleNotice(notice)}
                          title="Toggle Active"
                        >
                          {notice.active !== false ? (
                            <ToggleRight size={26} color="var(--primary, #e2fd52)" />
                          ) : (
                            <ToggleLeft size={26} color="var(--text-muted)" />
                          )}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => {
                            setEditingNotice(notice);
                            setShowNoticeModal(true);
                          }}
                          title="Edit Notice"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDeleteNotice(notice.id)}
                          title="Delete Notice"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── TAB 2: PROMO BANNER ── */}
        {activeTab === 'promo' && (
          <motion.div
            key="tab-promo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {/* Live Interactive Preview */}
            <div className="preview-card">
              <div className="preview-header">
                <div className="preview-title">
                  <Eye size={15} /> Storefront Live Homepage Promo Preview
                </div>
                <div className="live-badge">
                  <span className="live-pulse"></span>
                  {activePromoBanner ? 'Active Banner' : 'No Active Banner'}
                </div>
              </div>

              {activePromoBanner ? (
                <div className="simulated-promo-banner">
                  <div className="simulated-promo-content">
                    {activePromoBanner.badgeText && (
                      <span className="simulated-promo-tag">
                        {activePromoBanner.badgeText}
                      </span>
                    )}
                    <h2 className="simulated-promo-title">
                      {activePromoBanner.title} {activePromoBanner.highlightText && <br />}
                      {activePromoBanner.highlightText && <span>{activePromoBanner.highlightText}</span>}
                    </h2>
                    <p className="simulated-promo-desc">
                      {activePromoBanner.couponCode && activePromoBanner.description?.includes(activePromoBanner.couponCode) ? (
                        activePromoBanner.description.split(activePromoBanner.couponCode).map((part, i, arr) => (
                          <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <span className="simulated-promo-code">
                                {activePromoBanner.couponCode}
                              </span>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <>
                          {activePromoBanner.description || ''}
                          {activePromoBanner.couponCode && (
                            <>
                              {' '}Use code <span className="simulated-promo-code">{activePromoBanner.couponCode}</span>
                            </>
                          )}
                        </>
                      )}
                    </p>
                    <button className="simulated-promo-btn">
                      {activePromoBanner.btnText || 'Shop Now'} <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: '#0d0d12' }}>
                  <Tag size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 0.35rem' }}>
                    No Active Promo Banner
                  </p>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                    Click "+ Add Promo Banner" below to create and activate a promotional banner on the homepage.
                  </p>
                </div>
              )}
            </div>

            {/* Promo Banners Grid & Management */}
            <div className="items-table-card">
              <div className="items-table-header">
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                  Promo Banners ({promoBanners.length})
                </h3>
                {promoBanners.length === 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={handleSeedPromo}>
                    <Sparkles size={13} /> Initialize Summer Promo
                  </button>
                )}
              </div>

              {loading ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading promo banners...
                </div>
              ) : promoBanners.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                  <Tag size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    No promo banners created yet.
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Populate the default Summer Collection 40% OFF banner to get started.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={handleSeedPromo}>
                    Load Summer Collection Banner
                  </button>
                </div>
              ) : (
                <div className="promo-banners-grid">
                  {promoBanners.map((promo) => (
                    <div
                      key={promo.id}
                      className={`promo-admin-card ${promo.active !== false ? 'active-card' : ''}`}
                    >
                      <div className="promo-admin-header">
                        <span className="promo-admin-badge">{promo.badgeText || 'SPECIAL OFFER'}</span>
                        <button
                          className="toggle-btn"
                          onClick={() => handleTogglePromo(promo)}
                          title="Toggle Active"
                        >
                          {promo.active !== false ? (
                            <ToggleRight size={24} color="var(--primary, #e2fd52)" />
                          ) : (
                            <ToggleLeft size={24} color="var(--text-muted)" />
                          )}
                        </button>
                      </div>

                      <h4 className="promo-admin-title">
                        {promo.title}
                        <span>{promo.highlightText}</span>
                      </h4>

                      <p className="promo-admin-desc">{promo.description}</p>

                      <div className="promo-admin-meta">
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Code: <strong>{promo.couponCode || 'None'}</strong>
                        </span>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => {
                              setEditingPromo(promo);
                              setShowPromoModal(true);
                            }}
                            title="Edit Banner"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleDeletePromo(promo.id)}
                            title="Delete Banner"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Modals */}
      {showNoticeModal && (
        <AnnouncementModal
          announcement={editingNotice}
          onClose={() => {
            setShowNoticeModal(false);
            setEditingNotice(null);
          }}
          onSave={handleSaveNotice}
        />
      )}

      {showPromoModal && (
        <PromoBannerModal
          banner={editingPromo}
          onClose={() => {
            setShowPromoModal(false);
            setEditingPromo(null);
          }}
          onSave={handleSavePromo}
        />
      )}
    </AdminLayout>
  );
};

export default AdminPromotions;

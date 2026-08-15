import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Check, X, Eye, Monitor, Smartphone, Calendar, Clock, Megaphone, Sparkles, ExternalLink } from 'lucide-react';
import { popupAdService } from '../../../services/firestoreService';
import Toast from '../../../components/Toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

const PopupAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewAd, setPreviewAd] = useState(null);
  const [editingAd, setEditingAd] = useState(null);
  const [form, setForm] = useState({
    name: '',
    image: '',
    title: '',
    description: '',
    buttonText: '',
    buttonUrl: '',
    startDate: '',
    endDate: '',
    status: 'inactive',
    displayDelay: 2,
    displayFrequency: 'once_per_session',
    targetPages: [],
    enabledDesktop: true,
    enabledMobile: true,
  });
  const [toast, setToast] = useState(null);

  const loadAds = async () => {
    setLoading(true);
    try {
      const data = await popupAdService.getAll();
      setAds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const showMsg = (msg, type = 'success') => {
    setToast({ text: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setEditingAd(null);
    setForm({
      name: '',
      image: '',
      title: '',
      description: '',
      buttonText: 'Shop Now',
      buttonUrl: '/shop',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
      status: 'active',
      displayDelay: 2,
      displayFrequency: 'once_per_session',
      targetPages: ['/'],
      enabledDesktop: true,
      enabledMobile: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (ad) => {
    setEditingAd(ad);
    setForm({
      name: ad.name || '',
      image: ad.image || '',
      title: ad.title || '',
      description: ad.description || '',
      buttonText: ad.buttonText || '',
      buttonUrl: ad.buttonUrl || '',
      startDate: ad.startDate ? new Date(ad.startDate.seconds ? ad.startDate.seconds * 1000 : ad.startDate).toISOString().slice(0, 16) : '',
      endDate: ad.endDate ? new Date(ad.endDate.seconds ? ad.endDate.seconds * 1000 : ad.endDate).toISOString().slice(0, 16) : '',
      status: ad.status || 'inactive',
      displayDelay: ad.displayDelay ?? 2,
      displayFrequency: ad.displayFrequency || 'once_per_session',
      targetPages: ad.targetPages || [],
      enabledDesktop: ad.enabledDesktop !== undefined ? ad.enabledDesktop : true,
      enabledMobile: ad.enabledMobile !== undefined ? ad.enabledMobile : true,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePagesChange = (e) => {
    const pages = e.target.value.split(',').map(p => p.trim()).filter(p => p);
    setForm(prev => ({ ...prev, targetPages: pages }));
  };

  const saveAd = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        displayDelay: Number(form.displayDelay) || 0
      };
      if (editingAd) {
        await popupAdService.update(editingAd.id, payload);
        showMsg('Popup advertisement updated');
      } else {
        await popupAdService.create(payload);
        showMsg('New popup advertisement created');
      }
      setIsModalOpen(false);
      loadAds();
    } catch (err) {
      console.error(err);
      showMsg('Failed to save popup ad', 'error');
    }
  };

  const deleteAd = async (id) => {
    if (!window.confirm('Are you sure you want to delete this popup ad?')) return;
    try {
      await popupAdService.delete(id);
      showMsg('Popup advertisement deleted');
      loadAds();
    } catch (err) {
      console.error(err);
      showMsg('Failed to delete ad', 'error');
    }
  };

  const toggleActive = async (id, current) => {
    try {
      await popupAdService.update(id, { status: current ? 'inactive' : 'active' });
      showMsg(`Ad ${current ? 'deactivated' : 'activated'}`);
      loadAds();
    } catch (err) {
      console.error(err);
      showMsg('Failed to update status', 'error');
    }
  };

  const getAdStatusBadge = (ad) => {
    if (ad.status !== 'active') return <span className="status-badge inactive">Inactive</span>;
    const now = new Date();
    const start = ad.startDate ? new Date(ad.startDate.seconds ? ad.startDate.seconds * 1000 : ad.startDate) : null;
    const end = ad.endDate ? new Date(ad.endDate.seconds ? ad.endDate.seconds * 1000 : ad.endDate) : null;
    if (start && now < start) return <span className="badge badge-warning">Scheduled</span>;
    if (end && now > end) return <span className="badge badge-neutral">Expired</span>;
    return <span className="status-badge active">Active Now</span>;
  };

  return (
    <AdminLayout>
      {toast && <Toast isOpen={true} message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
      
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Page Header */}
        <motion.div className="page-header" variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(223,255,27,0.2), rgba(255,140,0,0.2))',
              border: '1px solid rgba(223,255,27,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Megaphone size={24} />
            </div>
            <div>
              <h1 className="page-title">Pop-up Ads Manager</h1>
              <p className="page-subtitle">Manage promotional popups, announcements, and targeted marketing campaigns.</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} /> Create Pop-up Ad
          </button>
        </motion.div>

        {/* Ads Table */}
        <motion.div variants={itemVariants} className="admin-table-container">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading pop-up ads...</div>
          ) : ads.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Megaphone size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <h3>No Pop-up Ads Defined</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Create a pop-up advertisement to engage customers with discounts & special offers.</p>
              <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ marginTop: '1rem' }}>
                <Plus size={14} /> Create First Pop-up Ad
              </button>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ad Name & Preview</th>
                  <th>Status</th>
                  <th>Target Pages</th>
                  <th>Frequency & Delay</th>
                  <th>Devices</th>
                  <th>Active Schedule</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.map(ad => (
                  <tr key={ad.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {ad.image ? (
                          <img src={ad.image} alt={ad.title} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                        ) : (
                          <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--bg-soft)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <Megaphone size={18} />
                          </div>
                        )}
                        <div>
                          <strong style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>{ad.name}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ad.title || 'No Title'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{getAdStatusBadge(ad)}</td>
                    <td>
                      <span className="sku-code">
                        {ad.targetPages && ad.targetPages.length > 0 ? ad.targetPages.join(', ') : 'All Pages'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.78rem' }}>
                        <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>{ad.displayFrequency?.replace(/_/g, ' ') || 'Once per session'}</span>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>Delay: {ad.displayDelay || 0}s</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', color: 'var(--text-dim)' }}>
                        {ad.enabledDesktop && <Monitor size={15} title="Desktop Enabled" color="var(--primary)" />}
                        {ad.enabledMobile && <Smartphone size={15} title="Mobile Enabled" color="var(--primary)" />}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <div>From: {ad.startDate ? new Date(ad.startDate.seconds ? ad.startDate.seconds * 1000 : ad.startDate).toLocaleDateString() : 'N/A'}</div>
                        <div>To: {ad.endDate ? new Date(ad.endDate.seconds ? ad.endDate.seconds * 1000 : ad.endDate).toLocaleDateString() : 'N/A'}</div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => setPreviewAd(ad)} title="Live Preview"><Eye size={15} color="var(--primary)" /></button>
                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(ad)} title="Edit"><Edit2 size={15} /></button>
                        <button className="btn btn-ghost btn-icon" onClick={() => deleteAd(ad.id)} style={{ color: 'var(--error)' }} title="Delete"><Trash2 size={15} /></button>
                        <button className="toggle-btn" onClick={() => toggleActive(ad.id, ad.status === 'active')} title="Toggle Status"> 
                          {ad.status === 'active' ? <ToggleRight size={22} color="var(--primary)" /> : <ToggleLeft size={22} color="var(--text-muted)" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* Create / Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
              <motion.div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 650, width: '90vw' }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                <div className="modal-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} color="var(--primary)" />
                    {editingAd ? 'Edit Pop-up Ad' : 'Create Pop-up Ad'}
                  </h3>
                  <button className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
                </div>

                <form onSubmit={saveAd}>
                  <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '72vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    
                    <div className="form-group">
                      <label className="form-label">Campaign Name *</label>
                      <input name="name" placeholder="E.g. Summer Sale 20% OFF Popup" value={form.name} onChange={handleChange} required className="form-input" />
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Banner Image URL</label>
                        <input name="image" placeholder="https://example.com/banner.jpg" value={form.image} onChange={handleChange} className="form-input" />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Headline Title</label>
                        <input name="title" placeholder="E.g. Get 20% OFF Your First Order!" value={form.title} onChange={handleChange} className="form-input" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Ad Description Text</label>
                      <textarea name="description" placeholder="Use code RETRO20 at checkout for an instant 20% discount." value={form.description} onChange={handleChange} className="form-input" rows={2} style={{ resize: 'vertical' }} />
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Button Text</label>
                        <input name="buttonText" placeholder="E.g. Claim Discount" value={form.buttonText} onChange={handleChange} className="form-input" />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Button Target URL</label>
                        <input name="buttonUrl" placeholder="E.g. /shop or https://..." value={form.buttonUrl} onChange={handleChange} className="form-input" />
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Start Date & Time *</label>
                        <input name="startDate" type="datetime-local" value={form.startDate} onChange={handleChange} required className="form-input" />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">End Date & Time *</label>
                        <input name="endDate" type="datetime-local" value={form.endDate} onChange={handleChange} required className="form-input" />
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Display Delay (Seconds)</label>
                        <input name="displayDelay" type="number" min="0" placeholder="2" value={form.displayDelay} onChange={handleChange} className="form-input" />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Display Frequency</label>
                        <select name="displayFrequency" value={form.displayFrequency} onChange={handleChange} className="form-input">
                          <option value="once_per_session">Once per Session</option>
                          <option value="once_per_day">Once per Day</option>
                          <option value="immediate">Show Every Page Load</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Target Pages (Comma Separated)</label>
                      <input name="targetPages" placeholder="e.g. /, /shop, /cart (leave blank for all pages)" value={form.targetPages.join(', ')} onChange={handlePagesChange} className="form-input" />
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', padding: '0.875rem 1rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        <input name="status" type="checkbox" checked={form.status === 'active'} onChange={e => setForm(prev => ({ ...prev, status: e.target.checked ? 'active' : 'inactive' }))} style={{ accentColor: 'var(--primary)' }} />
                        Active Status
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        <input name="enabledDesktop" type="checkbox" checked={form.enabledDesktop} onChange={handleChange} style={{ accentColor: 'var(--primary)' }} />
                        Desktop Enabled
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        <input name="enabledMobile" type="checkbox" checked={form.enabledMobile} onChange={handleChange} style={{ accentColor: 'var(--primary)' }} />
                        Mobile Enabled
                      </label>
                    </div>

                  </div>

                  <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPreviewAd(form)}>
                      <Eye size={14} /> Preview Popup
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary"><Check size={14} /> {editingAd ? 'Update Ad' : 'Create Ad'}</button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Live Preview Modal */}
        <AnimatePresence>
          {previewAd && (
            <div className="modal-backdrop" onClick={() => setPreviewAd(null)} style={{ background: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
              <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 20 }}
                style={{
                  maxWidth: 450,
                  width: '90vw',
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                  border: '1px solid var(--border-bright)',
                  position: 'relative'
                }}
              >
                <button
                  onClick={() => setPreviewAd(null)}
                  style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 10,
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>

                {previewAd.image ? (
                  <img src={previewAd.image} alt={previewAd.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: '140px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                    <Megaphone size={48} />
                  </div>
                )}

                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    {previewAd.title || previewAd.name || 'Special Offer'}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                    {previewAd.description || 'Don\'t miss out on our exclusive deals and retro fashion collections.'}
                  </p>

                  {previewAd.buttonText && (
                    <a
                      href={previewAd.buttonUrl || '#'}
                      onClick={e => { e.preventDefault(); setPreviewAd(null); }}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: 700, borderRadius: '10px' }}
                    >
                      {previewAd.buttonText} <ExternalLink size={14} />
                    </a>
                  )}

                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '0.75rem' }}>
                    Preview Mode (Delay: {previewAd.displayDelay || 0}s)
                  </span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </AdminLayout>
  );
};

export default PopupAds;


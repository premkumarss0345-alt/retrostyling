import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { Plus, Edit2, Trash2, Eye, Image as ImageIcon, ToggleLeft, ToggleRight, Search, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { db, storage } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const TYPES = ['homepage', 'promotional', 'popup', 'seasonal'];
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const BannerFormModal = ({ banner, onClose, onSave }) => {
  const [form, setForm] = useState(banner || { title: '', subtitle: '', type: 'homepage', link: '', active: true, order: 1, startDate: '', endDate: '', image: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h3>{banner ? 'Edit Banner' : 'Add New Banner'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Image Link Input */}
          <div className="banner-image-upload">
            <div className="banner-img-preview">
              {form.image ? (
                <img src={form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <ImageIcon size={32} color="var(--text-muted)" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Banner Image URL</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Recommended: 1920×600px for homepage banners</p>
              <input 
                className="form-input" 
                placeholder="https://images.unsplash.com/..." 
                value={form.image || ''} 
                onChange={e => set('image', e.target.value)} 
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Banner Title *</label>
              <input className="form-input" placeholder="E.g. Summer Sale 2026" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Subtitle</label>
              <input className="form-input" placeholder="Short description" value={form.subtitle || ''} onChange={e => set('subtitle', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Banner Type</label>
              <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Display Order</label>
              <input className="form-input" type="number" min="1" value={form.order} onChange={e => set('order', parseInt(e.target.value))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Link URL</label>
              <input className="form-input" placeholder="/shop or https://..." value={form.link || ''} onChange={e => set('link', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={form.startDate || ''} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={form.endDate || ''} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>
          <label className="checkbox-wrapper">
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
            Active (visible on site)
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>
            {banner ? 'Update Banner' : 'Add Banner'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editBanner, setEditBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'banners'));
      const bannersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by order
      bannersData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(bannersData);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const filtered = banners.filter(b => filterType === 'all' || b.type === filterType);

  const handleSave = async (form) => {
    try {
      if (editBanner) {
        const bannerRef = doc(db, 'banners', editBanner.id);
        await updateDoc(bannerRef, form);
      } else {
        await addDoc(collection(db, 'banners'), form);
      }
      setShowForm(false);
      setEditBanner(null);
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner');
    }
  };

  const handleDelete = async (id) => { 
    if (window.confirm('Delete this banner?')) {
      try {
        await deleteDoc(doc(db, 'banners', id));
        fetchBanners();
      } catch (error) {
        console.error('Error deleting banner:', error);
        alert('Failed to delete banner');
      }
    }
  };

  const toggleActive = async (banner) => {
    try {
      const bannerRef = doc(db, 'banners', banner.id);
      await updateDoc(bannerRef, { active: !banner.active });
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, active: !b.active } : b));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <AdminLayout>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Banner Management</h1>
            <p className="page-subtitle">Manage homepage banners, promotional banners, popups, and seasonal campaigns.</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditBanner(null); setShowForm(true); }}>
            <Plus size={14} /> Add Banner
          </button>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div variants={itemVariants}>
          <div className="period-tabs" style={{ width: 'fit-content' }}>
            {['all', ...TYPES].map(t => (
              <button key={t} className={`period-btn ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Banner Cards */}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading banners...</div>
        ) : (
          <div className="banners-grid">
            {filtered.map(banner => (
              <motion.div key={banner.id} className="banner-card" variants={itemVariants}>
                <div className="banner-card-image">
                  {banner.image ? (
                    <img src={banner.image} alt={banner.title} className="img-cover" />
                  ) : (
                    <div className="banner-placeholder"><ImageIcon size={32} /></div>
                  )}
                  <div className="banner-card-overlay">
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditBanner(banner); setShowForm(true); }}>
                      <Edit2 size={13} /> Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(banner.id)}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                  <span className={`banner-type-badge ${banner.active ? 'badge-success' : 'badge-neutral'}`}>
                    {banner.active ? '● Live' : '○ Hidden'}
                  </span>
                  <span className="banner-type-label">{banner.type}</span>
                </div>
                <div className="banner-card-body">
                  <h3>{banner.title}</h3>
                  {banner.subtitle && <p>{banner.subtitle}</p>}
                  <div className="banner-meta">
                    <span>{banner.startDate} → {banner.endDate || 'No end'}</span>
                    <button className="toggle-btn" onClick={() => toggleActive(banner)} title="Toggle Active">
                      {banner.active ? <ToggleRight size={22} color="var(--primary)" /> : <ToggleLeft size={22} color="var(--text-muted)" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add Banner Card */}
            <motion.div
              className="banner-add-card"
              variants={itemVariants}
              onClick={() => { setEditBanner(null); setShowForm(true); }}
              whileHover={{ scale: 1.02 }}
            >
              <Plus size={32} />
              <span>Add Banner</span>
            </motion.div>
          </div>
        )}

        {(showForm || editBanner) && (
          <BannerFormModal banner={editBanner} onClose={() => { setShowForm(false); setEditBanner(null); }} onSave={handleSave} />
        )}
      </motion.div>

      <style>{`
        .banners-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .banner-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; transition: var(--transition); }
        .banner-card:hover { border-color: var(--border-bright); }
        .banner-card-image { position: relative; height: 160px; background: var(--bg-soft); overflow: hidden; }
        .banner-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-faint); }
        .banner-card-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; gap: 0.5rem; opacity: 0; transition: opacity 0.2s; }
        .banner-card:hover .banner-card-overlay { opacity: 1; }
        .banner-type-badge { position: absolute; top: 0.75rem; right: 0.75rem; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 700; backdrop-filter: blur(8px); }
        .badge-success { background: rgba(34,197,94,0.2); color: var(--success); border: 1px solid rgba(34,197,94,0.3); }
        .banner-type-label { position: absolute; bottom: 0.75rem; left: 0.75rem; background: rgba(0,0,0,0.6); color: white; padding: 0.15rem 0.5rem; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 600; text-transform: capitalize; backdrop-filter: blur(4px); }
        .banner-card-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.4rem; }
        .banner-card-body h3 { font-size: 0.95rem; font-weight: 700; }
        .banner-card-body p { font-size: 0.8rem; color: var(--text-muted); }
        .banner-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem; font-size: 0.75rem; color: var(--text-muted); }
        .toggle-btn { background: none; border: none; cursor: pointer; display: flex; padding: 0; }
        .banner-add-card { background: var(--bg-soft); border: 2px dashed var(--border-bright); border-radius: var(--radius-md); min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; color: var(--text-muted); font-weight: 600; transition: var(--transition); }
        .banner-add-card:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
        .banner-image-upload { display: flex; gap: 1rem; align-items: center; padding: 1rem; background: var(--bg-soft); border-radius: var(--radius-sm); border: 1px dashed var(--border-bright); }
        .banner-img-preview { width: 120px; height: 70px; border-radius: var(--radius-sm); background: var(--bg-card); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); overflow: hidden; flex-shrink: 0; }
      `}</style>
    </AdminLayout>
  );
};

export default Banners;


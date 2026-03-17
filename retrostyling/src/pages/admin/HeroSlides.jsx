import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { heroService } from '../../services/firestoreService';
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';
import './HeroSlides.css';

const AdminHeroSlides = () => {
  const [slides, setSlides]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isFormOpen, setFormOpen]   = useState(false);
  const [editingSlide, setEditing]  = useState(null);
  const [saving, setSaving]         = useState(false);
  const [formData, setFormData]     = useState({
    title: '', subtitle: '', description: '', image: '', active: true, order: 0
  });

  useEffect(() => { loadSlides(); }, []);

  const loadSlides = async () => {
    setLoading(true);
    try {
      const data = await heroService.getAll();
      setSlides(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormData({ title: '', subtitle: '', description: '', image: '', active: true, order: slides.length });
    setFormOpen(true);
  };

  const handleEdit = (slide) => {
    setEditing(slide);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      image: slide.image || '',
      active: slide.active !== false,
      order: slide.order || 0,
    });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slide?')) return;
    try {
      await heroService.delete(id);
      setSlides((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (slide) => {
    try {
      await heroService.update(slide.id, { active: !slide.active });
      setSlides((prev) => prev.map((s) => s.id === slide.id ? { ...s, active: !s.active } : s));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSlide) {
        await heroService.update(editingSlide.id, formData);
      } else {
        await heroService.create(formData);
      }
      setFormOpen(false);
      await loadSlides();
    } catch (err) {
      console.error(err);
      alert('Failed to save slide: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-title">Hero Slides</h2>
          <p className="admin-subtitle">Manage homepage banner slides</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Add Slide
        </button>
      </div>

      {isFormOpen && (
        <div className="category-form-overlay">
          <div className="category-form-modal glass-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingSlide ? 'Edit Slide' : 'New Slide'}</h3>
              <button onClick={() => setFormOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Image URL</label>
                <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." required />
                {formData.image && <img src={formData.image} alt="preview" style={{ marginTop: '8px', maxHeight: '120px', borderRadius: '8px' }} />}
              </div>
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Subtitle (optional)</label>
                <input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Display Order</label>
                  <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Active</label>
                  <select value={String(formData.active)} onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="slides-grid">
        {loading ? (
          <p>Loading slides...</p>
        ) : slides.length === 0 ? (
          <p>No slides yet. Add your first hero slide!</p>
        ) : slides.map((slide) => (
          <div key={slide.id} className="slide-card glass-card" style={{ opacity: slide.active ? 1 : 0.5 }}>
            <div className="slide-image-wrapper">
              {!slide.active && <span className="inactive-badge">Off</span>}
              {slide.image
                ? <img src={slide.image} alt={slide.title} className="slide-img" />
                : <div className="no-img-placeholder">No Image</div>
              }
            </div>
            <div className="slide-details">
              <h4>{slide.title}</h4>
              <p className="slide-sub">{slide.subtitle}</p>
              <p className="slide-desc">{slide.description}</p>
            </div>
            <div className="slide-actions">
              <button className="icon-btn" title={slide.active ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(slide)}>
                {slide.active ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button className="icon-btn" onClick={() => handleEdit(slide)}>
                <Edit size={16} />
              </button>
              <button className="icon-btn delete" onClick={() => handleDelete(slide.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminHeroSlides;

import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { Plus, Edit2, Trash2, Search, Globe, ToggleLeft, ToggleRight, Image } from 'lucide-react';
import { motion } from 'framer-motion';

const mockBrands = [
  { id: 1, name: 'Retrostylings', slug: 'retrostylings', logo: '', website: 'https://retrostylings.com', status: 'active', products: 48, featured: true },
  { id: 2, name: 'UrbanEdge', slug: 'urbanedge', logo: '', website: '', status: 'active', products: 22, featured: false },
  { id: 3, name: 'VintageVibes', slug: 'vintagevibes', logo: '', website: '', status: 'inactive', products: 15, featured: false },
  { id: 4, name: 'ModernStreet', slug: 'modernstreet', logo: '', website: 'https://modernstreet.in', status: 'active', products: 31, featured: true },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const BrandFormModal = ({ brand, onClose, onSave }) => {
  const [form, setForm] = useState(brand || { name: '', slug: '', website: '', description: '', status: 'active', featured: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h3>{brand ? 'Edit Brand' : 'Add New Brand'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="brand-logo-upload">
            <div className="brand-logo-preview">
              <Image size={32} color="var(--text-muted)" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Brand Logo</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PNG, JPG up to 2MB. Recommended: 200×200px</p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>Upload Logo</button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Brand Name *</label>
            <input className="form-input" placeholder="Enter brand name" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Slug</label>
            <input className="form-input" placeholder="brand-slug" value={form.slug} onChange={e => set('slug', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Website</label>
            <input className="form-input" placeholder="https://..." value={form.website} onChange={e => set('website', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="Brand description..." value={form.description || ''} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Featured</label>
              <label className="checkbox-wrapper" style={{ marginTop: '0.75rem' }}>
                <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
                Show on homepage
              </label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>
            {brand ? 'Update Brand' : 'Create Brand'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Brands = () => {
  const [brands, setBrands] = useState(mockBrands);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editBrand, setEditBrand] = useState(null);

  const filtered = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (form) => {
    if (editBrand) {
      setBrands(prev => prev.map(b => b.id === editBrand.id ? { ...b, ...form } : b));
    } else {
      setBrands(prev => [...prev, { id: Date.now(), ...form, products: 0 }]);
    }
    setShowForm(false);
    setEditBrand(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this brand?')) setBrands(prev => prev.filter(b => b.id !== id));
  };

  const toggleFeatured = (id) => setBrands(prev => prev.map(b => b.id === id ? { ...b, featured: !b.featured } : b));

  return (
    <AdminLayout>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Brand Management</h1>
            <p className="page-subtitle">Manage product brands, logos, and visibility settings.</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditBrand(null); setShowForm(true); }}>
            <Plus size={14} /> Add Brand
          </button>
        </motion.div>

        {/* Brand Cards Grid */}
        <div className="search-wrapper" style={{ maxWidth: 320 }}>
          <Search size={16} className="search-icon" />
          <input className="form-input search-input" placeholder="Search brands..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <motion.div className="brands-grid" variants={containerVariants}>
          {filtered.map(brand => (
            <motion.div key={brand.id} className="brand-card" variants={itemVariants}>
              <div className="brand-card-header">
                <div className="brand-logo-placeholder">
                  {brand.name.charAt(0)}
                </div>
                <div className="brand-card-actions">
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditBrand(brand); setShowForm(true); }} title="Edit"><Edit2 size={14} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(brand.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="brand-card-name">{brand.name}</h3>
              <div className="brand-card-meta">
                <span className={`badge ${brand.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{brand.status}</span>
                <span className="text-muted text-sm">{brand.products} products</span>
              </div>
              {brand.website && (
                <a href={brand.website} target="_blank" rel="noreferrer" className="brand-website">
                  <Globe size={12} /> {brand.website.replace('https://', '')}
                </a>
              )}
              <div className="brand-featured-toggle">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Featured on homepage</span>
                <button className="toggle-btn" onClick={() => toggleFeatured(brand.id)}>
                  {brand.featured ? <ToggleRight size={22} color="var(--primary)" /> : <ToggleLeft size={22} color="var(--text-muted)" />}
                </button>
              </div>
            </motion.div>
          ))}

          {/* Add New Card */}
          <motion.div
            className="brand-card brand-add-card"
            variants={itemVariants}
            onClick={() => { setEditBrand(null); setShowForm(true); }}
            whileHover={{ scale: 1.02 }}
          >
            <Plus size={28} />
            <span>Add New Brand</span>
          </motion.div>
        </motion.div>

        {(showForm || editBrand) && (
          <BrandFormModal brand={editBrand} onClose={() => { setShowForm(false); setEditBrand(null); }} onSave={handleSave} />
        )}
      </motion.div>

      <style>{`
        .brands-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
        .brand-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; transition: var(--transition); }
        .brand-card:hover { border-color: var(--border-bright); }
        .brand-card-header { display: flex; align-items: flex-start; justify-content: space-between; }
        .brand-logo-placeholder { width: 52px; height: 52px; border-radius: var(--radius-sm); background: linear-gradient(135deg, var(--primary-light), rgba(139,92,246,0.1)); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-family: var(--ff-heading); font-weight: 800; font-size: 1.4rem; color: var(--primary); }
        .brand-card-actions { display: flex; gap: 0.25rem; opacity: 0; transition: opacity 0.2s; }
        .brand-card:hover .brand-card-actions { opacity: 1; }
        .brand-card-name { font-size: 1rem; font-weight: 700; }
        .brand-card-meta { display: flex; align-items: center; gap: 0.5rem; }
        .brand-website { font-size: 0.75rem; color: var(--primary); display: flex; align-items: center; gap: 0.3rem; }
        .brand-featured-toggle { display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem; padding-top: 0.6rem; border-top: 1px solid var(--border); }
        .toggle-btn { background: none; border: none; cursor: pointer; display: flex; }
        .brand-add-card { border-style: dashed; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); font-size: 0.875rem; font-weight: 600; gap: 0.75rem; min-height: 180px; }
        .brand-add-card:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
        .brand-logo-upload { display: flex; gap: 1rem; align-items: center; padding: 1rem; background: var(--bg-soft); border-radius: var(--radius-sm); border: 1px dashed var(--border-bright); }
        .brand-logo-preview { width: 60px; height: 60px; border-radius: var(--radius-sm); background: var(--bg-card); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); }
        .table-actions { display: flex; gap: 0.25rem; }
        .sku-code { font-family: monospace; font-size: 0.78rem; color: var(--text-muted); background: var(--bg-soft); padding: 0.15rem 0.4rem; border-radius: 4px; }
        .inv-page { display: flex; flex-direction: column; gap: 1.5rem; }
        .inv-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .inv-stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; display: flex; gap: 1rem; align-items: center; }
        .inv-stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .inv-stat-value { font-size: 1.5rem; font-weight: 800; font-family: var(--ff-heading); }
        .inv-stat-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .inv-controls { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
        .inv-filter-tabs { display: flex; background: var(--bg-soft); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 3px; gap: 2px; }
        .inv-adj-product { padding: 0.75rem 1rem; background: var(--bg-soft); border-radius: var(--radius-sm); margin-bottom: 0.5rem; }
        .inv-adj-product p { font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem; }
      `}</style>
    </AdminLayout>
  );
};

export default Brands;

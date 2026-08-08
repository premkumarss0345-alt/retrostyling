import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { categoryService, subcategoryService } from '../../services/firestoreService';
import { Plus, Edit, Trash2, Camera, Save, X, ArrowUp, ArrowDown, Folder, Layers, Eye, EyeOff, Star, Upload, Search, Filter, RefreshCw } from 'lucide-react';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Categories.css';

const AdminCategories = () => {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'subcategories'
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterParentId, setFilterParentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catFormData, setCatFormData] = useState({
    name: '',
    slug: '',
    image: '',
    description: '',
    status: 'active',
    featured: false,
    displayOrder: 1,
    seoTitle: '',
    seoDescription: '',
  });

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [subFormData, setSubFormData] = useState({
    categoryId: '',
    name: '',
    slug: '',
    image: '',
    description: '',
    status: 'active',
    featured: false,
    displayOrder: 1,
    seoTitle: '',
    seoDescription: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cats, subs] = await Promise.all([
        categoryService.getAllAdmin(),
        subcategoryService.getAllAdmin(),
      ]);
      setCategories(cats);
      setSubcategories(subs);
    } catch (err) {
      console.error('Failed to load category data:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Image Upload Helper ────────────────────────────────── */
  const handleImageUpload = async (e, setForm) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const fileRef = ref(storage, `categories/${Date.now()}_${cleanName}`);
      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);
      setForm(prev => ({ ...prev, image: downloadUrl }));
    } catch (err) {
      console.error('Category image upload error:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  /* ── Category Handlers ───────────────────────────────────── */
  const openNewCategory = () => {
    setEditingCategory(null);
    setCatFormData({
      name: '',
      slug: '',
      image: '',
      description: '',
      status: 'active',
      featured: false,
      displayOrder: categories.length + 1,
      seoTitle: '',
      seoDescription: '',
    });
    setIsCatModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      image: cat.image || '',
      description: cat.description || '',
      status: cat.status || 'active',
      featured: Boolean(cat.featured),
      displayOrder: cat.displayOrder || 1,
      seoTitle: cat.seoTitle || '',
      seoDescription: cat.seoDescription || '',
    });
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    const slug = catFormData.slug || catFormData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const payload = { ...catFormData, slug };

    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, payload);
      } else {
        await categoryService.create(payload);
      }
      setIsCatModalOpen(false);
      await loadAllData();
    } catch (err) {
      console.error('Failed to save category:', err);
      alert('Failed to save category: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Associated subcategories will also be deleted.')) return;
    try {
      await categoryService.delete(id);
      await loadAllData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete category: ' + err.message);
    }
  };

  const handleToggleCategoryStatus = async (cat) => {
    const nextStatus = cat.status === 'active' ? 'inactive' : 'active';
    try {
      await categoryService.update(cat.id, { status: nextStatus });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveCategoryOrder = async (index, direction) => {
    const list = [...categories];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    setCategories(list);
    try {
      await categoryService.reorder(list);
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Subcategory Handlers ────────────────────────────────── */
  const openNewSubcategory = (presetCatId = '') => {
    setEditingSubcategory(null);
    setSubFormData({
      categoryId: presetCatId || filterParentId || categories[0]?.id || '',
      name: '',
      slug: '',
      image: '',
      description: '',
      status: 'active',
      featured: false,
      displayOrder: subcategories.length + 1,
      seoTitle: '',
      seoDescription: '',
    });
    setIsSubModalOpen(true);
  };

  const openEditSubcategory = (sub) => {
    setEditingSubcategory(sub);
    setSubFormData({
      categoryId: sub.categoryId || '',
      name: sub.name || '',
      slug: sub.slug || '',
      image: sub.image || '',
      description: sub.description || '',
      status: sub.status || 'active',
      featured: Boolean(sub.featured),
      displayOrder: sub.displayOrder || 1,
      seoTitle: sub.seoTitle || '',
      seoDescription: sub.seoDescription || '',
    });
    setIsSubModalOpen(true);
  };

  const handleSaveSubcategory = async (e) => {
    e.preventDefault();
    if (!subFormData.categoryId) {
      alert('Please select a parent Category');
      return;
    }
    setSaving(true);
    const slug = subFormData.slug || subFormData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const parentCat = categories.find(c => c.id === subFormData.categoryId);

    const payload = {
      ...subFormData,
      slug,
      categoryName: parentCat?.name || '',
      categorySlug: parentCat?.slug || '',
    };

    try {
      if (editingSubcategory) {
        await subcategoryService.update(editingSubcategory.id, payload);
      } else {
        await subcategoryService.create(payload);
      }
      setIsSubModalOpen(false);
      await loadAllData();
    } catch (err) {
      console.error('Failed to save subcategory:', err);
      alert('Failed to save subcategory: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubcategory = async (id) => {
    if (!window.confirm('Delete this subcategory?')) return;
    try {
      await subcategoryService.delete(id);
      await loadAllData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete subcategory: ' + err.message);
    }
  };

  const handleToggleSubcategoryStatus = async (sub) => {
    const nextStatus = sub.status === 'active' ? 'inactive' : 'active';
    try {
      await subcategoryService.update(sub.id, { status: nextStatus });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveSubcategoryOrder = async (sub, direction) => {
    const group = subcategories.filter(s => s.categoryId === sub.categoryId);
    const index = group.findIndex(s => s.id === sub.id);
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= group.length) return;

    const temp = group[index];
    group[index] = group[targetIdx];
    group[targetIdx] = temp;

    try {
      await subcategoryService.reorder(group);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  /* Filter lists */
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubcategories = subcategories.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesParent = filterParentId ? s.categoryId === filterParentId : true;
    return matchesSearch && matchesParent;
  });

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-title">Categories & Subcategories</h2>
          <p className="admin-subtitle">Manage hierarchical product taxonomy, navigation & SEO metadata</p>
        </div>
        <div className="header-actions">
          {activeTab === 'categories' ? (
            <button className="btn btn-primary" onClick={openNewCategory}>
              <Plus size={18} /> Add Category
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => openNewSubcategory()}>
              <Plus size={18} /> Add Subcategory
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="taxonomy-tabs-bar">
        <button
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Folder size={18} /> Categories ({categories.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'subcategories' ? 'active' : ''}`}
          onClick={() => setActiveTab('subcategories')}
        >
          <Layers size={18} /> Subcategories ({subcategories.length})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="admin-filters-bar" style={{ marginTop: '1rem' }}>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={activeTab === 'categories' ? "Search categories..." : "Search subcategories..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {activeTab === 'subcategories' && (
          <div className="filter-group">
            <select
              value={filterParentId}
              onChange={(e) => setFilterParentId(e.target.value)}
              className="filter-select"
            >
              <option value="">All Parent Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Categories View */}
      {activeTab === 'categories' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Order</th>
                <th style={{ width: 80 }}>Image</th>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Subcategories</th>
                <th>Featured</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading categories...</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No categories found.</td></tr>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const subCount = subcategories.filter(s => s.categoryId === cat.id).length;
                  return (
                    <tr key={cat.id}>
                      <td>
                        <div className="reorder-btns">
                          <button onClick={() => handleMoveCategoryOrder(idx, -1)} disabled={idx === 0} title="Move Up"><ArrowUp size={14} /></button>
                          <span>{cat.displayOrder || idx + 1}</span>
                          <button onClick={() => handleMoveCategoryOrder(idx, 1)} disabled={idx === filteredCategories.length - 1} title="Move Down"><ArrowDown size={14} /></button>
                        </div>
                      </td>
                      <td>
                        <div className="category-thumb">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} />
                          ) : (
                            <div className="no-img"><Camera size={18} /></div>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{cat.name}</strong>
                        {cat.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{cat.description}</p>}
                      </td>
                      <td><code>/{cat.slug}</code></td>
                      <td>
                        <button
                          className="sub-count-badge"
                          onClick={() => { setFilterParentId(cat.id); setActiveTab('subcategories'); }}
                          title="View subcategories"
                        >
                          <Layers size={13} /> {subCount} Subcategories
                        </button>
                      </td>
                      <td>
                        {cat.featured ? (
                          <span className="badge-featured"><Star size={13} /> Featured</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No</span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`status-toggle-btn ${cat.status === 'active' ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleCategoryStatus(cat)}
                        >
                          {cat.status === 'active' ? <><Eye size={13} /> Active</> : <><EyeOff size={13} /> Inactive</>}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button className="icon-btn" onClick={() => openEditCategory(cat)} title="Edit Category"><Edit size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleDeleteCategory(cat.id)} title="Delete Category"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Subcategories View */}
      {activeTab === 'subcategories' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Order</th>
                <th style={{ width: 80 }}>Image</th>
                <th>Subcategory</th>
                <th>Parent Category</th>
                <th>Slug</th>
                <th>Featured</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading subcategories...</td></tr>
              ) : filteredSubcategories.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No subcategories found.</td></tr>
              ) : (
                filteredSubcategories.map((sub, idx) => (
                  <tr key={sub.id}>
                    <td>
                      <div className="reorder-btns">
                        <button onClick={() => handleMoveSubcategoryOrder(sub, -1)} title="Move Up"><ArrowUp size={14} /></button>
                        <span>{sub.displayOrder || idx + 1}</span>
                        <button onClick={() => handleMoveSubcategoryOrder(sub, 1)} title="Move Down"><ArrowDown size={14} /></button>
                      </div>
                    </td>
                    <td>
                      <div className="category-thumb">
                        {sub.image ? (
                          <img src={sub.image} alt={sub.name} />
                        ) : (
                          <div className="no-img"><Camera size={18} /></div>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{sub.name}</strong>
                      {sub.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{sub.description}</p>}
                    </td>
                    <td>
                      <span className="parent-cat-badge">
                        <Folder size={13} /> {sub.categoryName || 'Unassigned'}
                      </span>
                    </td>
                    <td><code>/{sub.categorySlug || 'cat'}/{sub.slug}</code></td>
                    <td>
                      {sub.featured ? (
                        <span className="badge-featured"><Star size={13} /> Featured</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`status-toggle-btn ${sub.status === 'active' ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleSubcategoryStatus(sub)}
                      >
                        {sub.status === 'active' ? <><Eye size={13} /> Active</> : <><EyeOff size={13} /> Inactive</>}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button className="icon-btn" onClick={() => openEditSubcategory(sub)} title="Edit Subcategory"><Edit size={16} /></button>
                        <button className="icon-btn delete" onClick={() => handleDeleteSubcategory(sub.id)} title="Delete Subcategory"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Category Form Modal ───────────────────────────────── */}
      {isCatModalOpen && (
        <div className="taxonomy-modal-overlay">
          <div className="taxonomy-modal-card glass-card">
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button type="button" onClick={() => setIsCatModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveCategory} className="taxonomy-form">
              <div className="form-grid-modal">
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    value={catFormData.name}
                    onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                    required
                    placeholder="e.g. Women's Clothing"
                  />
                </div>
                <div className="form-group">
                  <label>Category Slug (URL)</label>
                  <input
                    type="text"
                    value={catFormData.slug}
                    onChange={(e) => setCatFormData({ ...catFormData, slug: e.target.value })}
                    placeholder="e.g. womens-clothing"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category Image</label>
                <div className="img-upload-field">
                  <input
                    type="text"
                    value={catFormData.image}
                    onChange={(e) => setCatFormData({ ...catFormData, image: e.target.value })}
                    placeholder="https://..."
                    style={{ flex: 1 }}
                  />
                  <label className="btn btn-outline btn-upload">
                    {uploadingImage ? <RefreshCw size={15} className="spinner" /> : <Upload size={15} />} Upload
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setCatFormData)} style={{ display: 'none' }} disabled={uploadingImage} />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={catFormData.description}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  placeholder="Short description of this category..."
                ></textarea>
              </div>

              <div className="form-grid-modal">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={catFormData.status}
                    onChange={(e) => setCatFormData({ ...catFormData, status: e.target.value })}
                  >
                    <option value="active">Active (Visible to Customers)</option>
                    <option value="inactive">Inactive (Hidden from Shop)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={catFormData.displayOrder}
                    onChange={(e) => setCatFormData({ ...catFormData, displayOrder: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-check" style={{ marginBottom: '1.25rem' }}>
                <input
                  type="checkbox"
                  id="cat_featured"
                  checked={catFormData.featured}
                  onChange={(e) => setCatFormData({ ...catFormData, featured: e.target.checked })}
                />
                <label htmlFor="cat_featured">Feature on Navigation & Homepage</label>
              </div>

              {/* SEO Block */}
              <div className="seo-card-block">
                <h4>SEO Meta Data</h4>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label>SEO Title</label>
                  <input
                    type="text"
                    value={catFormData.seoTitle}
                    onChange={(e) => setCatFormData({ ...catFormData, seoTitle: e.target.value })}
                    placeholder="e.g. Women's Clothing & Dresses | RetroStylings"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>SEO Description</label>
                  <textarea
                    rows="2"
                    value={catFormData.seoDescription}
                    onChange={(e) => setCatFormData({ ...catFormData, seoDescription: e.target.value })}
                    placeholder="Search engine meta description..."
                  ></textarea>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsCatModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Subcategory Form Modal ────────────────────────────── */}
      {isSubModalOpen && (
        <div className="taxonomy-modal-overlay">
          <div className="taxonomy-modal-card glass-card">
            <div className="modal-header">
              <h3>{editingSubcategory ? 'Edit Subcategory' : 'Create Subcategory'}</h3>
              <button type="button" onClick={() => setIsSubModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="taxonomy-form">
              <div className="form-group">
                <label>Parent Category *</label>
                <select
                  value={subFormData.categoryId}
                  onChange={(e) => setSubFormData({ ...subFormData, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select Parent Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid-modal">
                <div className="form-group">
                  <label>Subcategory Name *</label>
                  <input
                    type="text"
                    value={subFormData.name}
                    onChange={(e) => setSubFormData({ ...subFormData, name: e.target.value })}
                    required
                    placeholder="e.g. Dresses"
                  />
                </div>
                <div className="form-group">
                  <label>Subcategory Slug (URL)</label>
                  <input
                    type="text"
                    value={subFormData.slug}
                    onChange={(e) => setSubFormData({ ...subFormData, slug: e.target.value })}
                    placeholder="e.g. dresses"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subcategory Image</label>
                <div className="img-upload-field">
                  <input
                    type="text"
                    value={subFormData.image}
                    onChange={(e) => setSubFormData({ ...subFormData, image: e.target.value })}
                    placeholder="https://..."
                    style={{ flex: 1 }}
                  />
                  <label className="btn btn-outline btn-upload">
                    {uploadingImage ? <RefreshCw size={15} className="spinner" /> : <Upload size={15} />} Upload
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setSubFormData)} style={{ display: 'none' }} disabled={uploadingImage} />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={subFormData.description}
                  onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
                  placeholder="Short description of this subcategory..."
                ></textarea>
              </div>

              <div className="form-grid-modal">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={subFormData.status}
                    onChange={(e) => setSubFormData({ ...subFormData, status: e.target.value })}
                  >
                    <option value="active">Active (Visible to Customers)</option>
                    <option value="inactive">Inactive (Hidden from Shop)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={subFormData.displayOrder}
                    onChange={(e) => setSubFormData({ ...subFormData, displayOrder: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-check" style={{ marginBottom: '1.25rem' }}>
                <input
                  type="checkbox"
                  id="sub_featured"
                  checked={subFormData.featured}
                  onChange={(e) => setSubFormData({ ...subFormData, featured: e.target.checked })}
                />
                <label htmlFor="sub_featured">Feature in Navigation & Highlights</label>
              </div>

              {/* SEO Block */}
              <div className="seo-card-block">
                <h4>SEO Meta Data</h4>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label>SEO Title</label>
                  <input
                    type="text"
                    value={subFormData.seoTitle}
                    onChange={(e) => setSubFormData({ ...subFormData, seoTitle: e.target.value })}
                    placeholder="e.g. Women's Evening & Party Dresses | RetroStylings"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>SEO Description</label>
                  <textarea
                    rows="2"
                    value={subFormData.seoDescription}
                    onChange={(e) => setSubFormData({ ...subFormData, seoDescription: e.target.value })}
                    placeholder="Subcategory search engine description..."
                  ></textarea>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsSubModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCategories;

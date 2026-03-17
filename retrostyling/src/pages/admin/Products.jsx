import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { productService, categoryService } from '../../services/firestoreService';
import ProductForm from './ProductForm';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import './Products.css';

const AdminProducts = () => {
  const [view, setView]                   = useState('list');
  const [products, setProducts]           = useState([]);
  const [categories, setCategories]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [editingProduct, setEditing]      = useState(null);
  const [searchTerm, setSearch]           = useState('');
  const [filterCategory, setFilterCat]   = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productService.getAllAdmin(),
        categoryService.getAll(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditing(null);
    setView('form');
  };

  const handleEdit = async (product) => {
    const full = await productService.getById(product.id);
    setEditing(full || product);
    setView('form');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productService.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleSave = async (formData) => {
    const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    // Find selected category to embed slug
    const cat = categories.find((c) => c.id === formData.category_id || c.id === String(formData.category_id));

    const payload = {
      name: formData.name,
      slug,
      description: formData.description || '',
      price: Number(formData.price),
      discount_price: Number(formData.discount_price) || 0,
      stock: Number(formData.stock),
      image: formData.image || '',
      category_id: formData.category_id || null,
      categoryName: cat?.name || '',
      categorySlug: cat?.slug || '',
      on_sale: Boolean(formData.on_sale),
      is_new: Boolean(formData.is_new),
      sku: formData.sku || '',
      brand: formData.brand || '',
      cost_price: Number(formData.cost_price || formData.costPrice) || 0,
      tax: Number(formData.tax) || 0,
      low_stock_threshold: Number(formData.low_stock_threshold || formData.lowStockAlert) || 5,
      track_inventory: Boolean(formData.track_inventory || formData.trackInventory),
      status: formData.status || 'active',
      variants: formData.variants || [],
    };

    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
      } else {
        await productService.create(payload);
      }
      await loadData();
      setView('list');
    } catch (err) {
      console.error(err);
      alert('Failed to save product: ' + err.message);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory ? p.category_id === filterCategory : true;
    return matchSearch && matchCat;
  });

  if (view === 'form') {
    return (
      <AdminLayout>
        <div className="admin-content-wrapper">
          <ProductForm
            product={editingProduct}
            onSave={handleSave}
            onCancel={() => setView('list')}
            categories={categories}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-title">Products</h2>
          <p className="admin-subtitle">Manage your product catalog</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleAddNew}>
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="admin-filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={filterCategory} onChange={(e) => setFilterCat(e.target.value)} className="filter-select">
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="product-thumb">
                    <img src={p.image || 'https://via.placeholder.com/40'} alt={p.name} />
                  </div>
                </td>
                <td>
                  <div className="product-name-cell">
                    <strong>{p.name}</strong>
                    <span className="sku-text">{p.sku || p.id.slice(0, 8)}</span>
                  </div>
                </td>
                <td>{p.categoryName || 'Uncategorized'}</td>
                <td>₹{p.price}</td>
                <td>
                  <span className={`stock-badge ${p.stock < 10 ? 'low' : ''}`}>{p.stock}</span>
                </td>
                <td>
                  <span className={`status-badge ${p.status === 'active' ? 'active' : 'inactive'}`}>
                    {p.stock > 0 ? (p.status || 'active') : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="icon-btn" onClick={() => handleEdit(p)}><Edit size={16} /></button>
                    <button className="icon-btn delete" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-product-list">
        {filtered.map((p) => (
          <div key={p.id} className="mobile-product-card">
            <div className="mobile-card-header">
              <img src={p.image} alt={p.name} className="mobile-thumb" />
              <div className="mobile-card-info">
                <h4>{p.name}</h4>
                <p className="price">₹{p.price}</p>
              </div>
              <span className={`status-badge small ${p.stock > 0 ? 'active' : 'inactive'}`}>
                {p.stock > 0 ? 'Active' : 'OST'}
              </span>
            </div>
            <div className="mobile-card-footer">
              <span>Stock: {p.stock}</span>
              <div className="mobile-actions">
                <button onClick={() => handleEdit(p)}>Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-red">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;

import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { API_BASE_URL } from '../../config';
import ProductForm from './ProductForm';
import { Plus, Search, Filter, Edit, Trash2, MoreVertical } from 'lucide-react';
import './Products.css'; // We'll create this CSS file next

const AdminProducts = () => {
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = () => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/products`)
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    const fetchCategories = () => {
        fetch(`${API_BASE_URL}/api/categories`)
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error(err));
    };

    const handleAddNew = () => {
        setEditingProduct(null);
        setView('form');
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setView('form');
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            const token = localStorage.getItem('token');
            fetch(`${API_BASE_URL}/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => {
                    if (res.ok) fetchProducts();
                    else alert('Failed to delete');
                })
                .catch(err => console.error(err));
        }
    };

    const handleSave = (formData) => {
        const token = localStorage.getItem('token');
        const method = editingProduct ? 'PUT' : 'POST';
        const url = editingProduct
            ? `${API_BASE_URL}/api/products/${editingProduct.id}`
            : `${API_BASE_URL}/api/products`;

        // Backend expects specific fields. We map/filter here.
        // Generate slug from name if not provided
        const slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const payload = {
            name: formData.name,
            slug: slug,
            description: formData.description,
            price: Number(formData.price),
            discount_price: Number(formData.discount_price) || 0,
            stock: Number(formData.stock),
            image: formData.image,
            category_id: Number(formData.category_id),
            on_sale: formData.on_sale ? 1 : 0,
            is_new: formData.is_new ? 1 : 0,
            sku: formData.sku,
            brand: formData.brand,
            cost_price: Number(formData.costPrice) || 0,
            tax: Number(formData.tax) || 0,
            low_stock_threshold: Number(formData.lowStockAlert) || 5,
            track_inventory: formData.trackInventory ? 1 : 0,
            status: formData.status
        };

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
            .then(res => {
                if (res.ok) {
                    fetchProducts();
                    setView('list');
                } else {
                    res.text().then(text => alert('Failed to save product: ' + text));
                }
            })
            .catch(err => console.error(err));
    };

    // Filter Logic
    const filteredProducts = Array.isArray(products) ? products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory ? p.category_id == filterCategory : true;
        return matchesSearch && matchesCategory;
    }) : [];

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
                    <button className="btn btn-outline">Import</button>
                    <button className="btn btn-outline">Export</button>
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
                        placeholder="Search product..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Categories</option>
                        {Array.isArray(categories) && categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <select className="filter-select">
                        <option value="">Status: All</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
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
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td></tr>
                        ) : (
                            filteredProducts.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="product-thumb">
                                            <img src={p.image || 'https://via.placeholder.com/40'} alt={p.name} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="product-name-cell">
                                            <strong>{p.name}</strong>
                                            <span className="sku-text">{p.sku || `SKU-${p.id}`}</span>
                                        </div>
                                    </td>
                                    <td>{p.category_name || 'Uncategorized'}</td>
                                    <td>₹{p.price}</td>
                                    <td>
                                        <span className={`stock-badge ${p.stock < 10 ? 'low' : ''}`}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${p.stock > 0 ? 'active' : 'inactive'}`}>
                                            {p.stock > 0 ? 'Active' : 'Out of Stock'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="icon-btn" onClick={() => handleEdit(p)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className="icon-btn delete" onClick={() => handleDelete(p.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View Card (Hidden on Desktop via CSS) */}
            <div className="mobile-product-list">
                {filteredProducts.map(p => (
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

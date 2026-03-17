import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { API_BASE_URL } from '../../config';
import { Plus, Edit, Trash2, Camera, Save, X } from 'lucide-react';
import './Categories.css';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', slug: '', image: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/categories`);
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (cat) => {
        setEditingCategory(cat);
        setFormData({ name: cat.name, slug: cat.slug, image: cat.image || '' });
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this category? This might affect products in this category.')) {
            const token = localStorage.getItem('token');
            try {
                await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchCategories();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const method = editingCategory ? 'PUT' : 'POST';
        const url = editingCategory
            ? `${API_BASE_URL}/api/admin/categories/${editingCategory.id}`
            : `${API_BASE_URL}/api/admin/categories`;

        const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, slug })
            });

            if (res.ok) {
                setIsFormOpen(false);
                setEditingCategory(null);
                setFormData({ name: '', slug: '', image: '' });
                fetchCategories();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AdminLayout>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-title">Categories</h2>
                    <p className="admin-subtitle">Manage your product classifications</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingCategory(null); setFormData({ name: '', slug: '', image: '' }); setIsFormOpen(true); }}>
                    <Plus size={18} /> Add Category
                </button>
            </div>

            {isFormOpen && (
                <div className="category-form-overlay">
                    <div className="category-form-modal glass-card">
                        <div className="modal-header">
                            <h3>{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                            <button onClick={() => setIsFormOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Category Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Slug (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="e.g. winter-wear"
                                />
                            </div>
                            <div className="form-group">
                                <label>Image URL</label>
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><Save size={18} /> Save Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Slug</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center">Loading...</td></tr>
                        ) : categories.map(cat => (
                            <tr key={cat.id}>
                                <td>
                                    <div className="category-thumb">
                                        {cat.image ? <img src={cat.image} alt={cat.name} /> : <div className="no-img"><Camera size={16} /></div>}
                                    </div>
                                </td>
                                <td><strong>{cat.name}</strong></td>
                                <td><code>/{cat.slug}</code></td>
                                <td>{new Date(cat.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="icon-btn" onClick={() => handleEdit(cat)}><Edit size={16} /></button>
                                        <button className="icon-btn delete" onClick={() => handleDelete(cat.id)}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
};

export default AdminCategories;

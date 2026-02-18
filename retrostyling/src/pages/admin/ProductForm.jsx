import React, { useState, useEffect } from 'react';
import { Camera, Save, X, ChevronLeft } from 'lucide-react';
import './ProductForm.css';

const ProductForm = ({ product, onSave, onCancel, categories }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category_id: '',
        brand: '',
        description: '',
        costPrice: '',
        price: '',
        discount_price: '',
        tax: '',
        stock: '',
        lowStockAlert: '',
        trackInventory: true,
        image: '',
        status: 'active',
        on_sale: false,
        is_new: false
    });

    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                category_id: product.category_id || '',
                // Map existing fields or use defaults
                sku: product.sku || `SKU-${product.id}`,
                brand: product.brand || '',
                costPrice: product.cost_price || '',
                tax: product.tax || '',
                lowStockAlert: product.low_stock_threshold || 5,
                status: product.stock > 0 ? 'active' : 'out_of_stock'
            });
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="product-form-container">
            <div className="form-header">
                <button onClick={onCancel} className="btn-back">
                    <ChevronLeft size={20} /> Back to Products
                </button>
                <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
                <div className="form-grid">
                    {/* 🔹 Basic Information */}
                    <div className="form-section">
                        <h3>Basic Information</h3>
                        <div className="form-group">
                            <label>Product Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Classic Black T-shirt"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>SKU *</label>
                                <input
                                    type="text"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    placeholder="e.g. TSHIRT-001"
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Brand</label>
                            <input
                                type="text"
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                placeholder="e.g. RetroStylings"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Product description..."
                            ></textarea>
                        </div>
                    </div>

                    {/* 🔹 Media */}
                    <div className="form-section">
                        <h3>Product Media</h3>
                        <div className="image-upload-box">
                            <div className="preview-area">
                                {formData.image ? (
                                    <img src={formData.image} alt="Preview" className="img-preview" />
                                ) : (
                                    <div className="placeholder-preview">
                                        <Camera size={48} />
                                        <p>No image uploaded</p>
                                    </div>
                                )}
                            </div>
                            <div className="upload-controls">
                                <label>Image URL</label>
                                <input
                                    type="text"
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                                <small>Drag & drop upload coming soon</small>
                            </div>
                        </div>
                    </div>

                    {/* 🔹 Pricing */}
                    <div className="form-section">
                        <h3>Pricing</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Cost Price (₹)</label>
                                <input
                                    type="number"
                                    name="costPrice"
                                    value={formData.costPrice}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Selling Price (₹) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Discount Price (₹)</label>
                                <input
                                    type="number"
                                    name="discount_price"
                                    value={formData.discount_price}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Tax (%)</label>
                                <input
                                    type="number"
                                    name="tax"
                                    value={formData.tax}
                                    onChange={handleChange}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="form-check">
                            <input
                                type="checkbox"
                                name="on_sale"
                                checked={formData.on_sale}
                                onChange={handleChange}
                                id="on_sale"
                            />
                            <label htmlFor="on_sale">On Sale</label>
                        </div>
                        <div className="form-check">
                            <input
                                type="checkbox"
                                name="is_new"
                                checked={formData.is_new}
                                onChange={handleChange}
                                id="is_new"
                            />
                            <label htmlFor="is_new">New Arrival</label>
                        </div>
                    </div>

                    {/* 🔹 Inventory */}
                    <div className="form-section">
                        <h3>Inventory</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Stock Quantity</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Low Stock Alert</label>
                                <input
                                    type="number"
                                    name="lowStockAlert"
                                    value={formData.lowStockAlert}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="form-check">
                            <input
                                type="checkbox"
                                name="trackInventory"
                                checked={formData.trackInventory}
                                onChange={handleChange}
                                id="trackInventory"
                            />
                            <label htmlFor="trackInventory">Track Inventory</label>
                        </div>
                    </div>
                </div>

                <div className="form-actions-bar">
                    <button type="button" onClick={onCancel} className="btn btn-outline">Cancel</button>
                    <button type="submit" className="btn btn-primary">
                        <Save size={18} /> {product ? 'Update Product' : 'Publish Product'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default ProductForm;

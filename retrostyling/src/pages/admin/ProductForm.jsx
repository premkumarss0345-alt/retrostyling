import React, { useState, useEffect } from 'react';
import { Camera, Save, X, ChevronLeft, Upload, Image as ImageIcon, RefreshCw, Trash2, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { subcategoryService } from '../../services/firestoreService';
import './ProductForm.css';

const ProductForm = ({ product, onSave, onCancel, categories }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category_id: '',
        categoryId: '',
        categoryName: '',
        categorySlug: '',
        subcategoryId: '',
        subcategoryName: '',
        subcategorySlug: '',
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
        is_new: false,
        variants: []
    });

    const [subcategories, setSubcategories] = useState([]);
    const [uploadingMain, setUploadingMain] = useState(false);
    const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);
    const [invalidImageUrls, setInvalidImageUrls] = useState({});

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                sku: product.sku || (product.id ? `SKU-${product.id.slice(0, 8)}` : ''),
                category_id: product.categoryId || product.category_id || '',
                categoryId: product.categoryId || product.category_id || '',
                categoryName: product.categoryName || '',
                categorySlug: product.categorySlug || '',
                subcategoryId: product.subcategoryId || '',
                subcategoryName: product.subcategoryName || '',
                subcategorySlug: product.subcategorySlug || '',
                brand: product.brand || '',
                description: product.description || '',
                costPrice: product.cost_price ?? product.costPrice ?? '',
                price: product.price ?? '',
                discount_price: product.discount_price ?? '',
                tax: product.tax ?? '',
                stock: product.stock ?? '',
                lowStockAlert: product.low_stock_threshold ?? product.lowStockAlert ?? 5,
                trackInventory: product.trackInventory ?? product.track_inventory ?? true,
                image: product.image || '',
                status: (product.stock > 0 || product.stock === '') ? (product.status || 'active') : 'out_of_stock',
                on_sale: Boolean(product.on_sale),
                is_new: Boolean(product.is_new),
                variants: (product.variants || []).map(v => ({
                    id: v.id || '',
                    color: v.color || '',
                    size: v.size || '',
                    stock: v.stock ?? '',
                    price: v.price ?? '',
                    price_override: v.price_override ?? '',
                    sku: v.sku || '',
                    image: v.image || '',
                    imageAlt: v.imageAlt || ''
                }))
            });
        }
    }, [product]);

    const activeCatId = formData.categoryId || formData.category_id;

    useEffect(() => {
        if (activeCatId) {
            subcategoryService.getByCategoryId(activeCatId, false).then(subs => {
                setSubcategories(subs);
            }).catch(() => setSubcategories([]));
        } else {
            setSubcategories([]);
        }
    }, [activeCatId]);

    const handleCategoryChange = (e) => {
        const catId = e.target.value;
        const cat = categories.find(c => c.id === catId);
        setFormData(prev => ({
            ...prev,
            category_id: catId,
            categoryId: catId,
            categoryName: cat?.name || '',
            categorySlug: cat?.slug || '',
            subcategoryId: '',
            subcategoryName: '',
            subcategorySlug: ''
        }));
    };

    const handleSubcategoryChange = (e) => {
        const subId = e.target.value;
        const sub = subcategories.find(s => s.id === subId);
        setFormData(prev => ({
            ...prev,
            subcategoryId: subId,
            subcategoryName: sub?.name || '',
            subcategorySlug: sub?.slug || ''
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMainFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingMain(true);
        try {
            const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
            const fileRef = ref(storage, `product_gallery/${Date.now()}_${cleanName}`);
            await uploadBytes(fileRef, file);
            const downloadUrl = await getDownloadURL(fileRef);
            setFormData(prev => ({ ...prev, image: downloadUrl }));
        } catch (err) {
            console.error('Firebase Storage main image upload error:', err);
            alert('Failed to upload main image: ' + err.message);
        } finally {
            setUploadingMain(false);
        }
    };

    const handleVariantFileUpload = async (index, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingVariantIndex(index);
        try {
            const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
            const fileRef = ref(storage, `product_variants/${Date.now()}_${cleanName}`);
            await uploadBytes(fileRef, file);
            const downloadUrl = await getDownloadURL(fileRef);

            setFormData(prev => {
                const updated = [...(prev.variants || [])];
                const v = updated[index];
                updated[index] = {
                    ...v,
                    image: downloadUrl,
                    imageAlt: v.imageAlt || `${v.color || ''} ${v.size || ''}`.trim() || 'Variant Image'
                };
                return { ...prev, variants: updated };
            });

            setInvalidImageUrls(prev => ({ ...prev, [index]: false }));
        } catch (err) {
            console.error('Firebase Storage variant upload error:', err);
            alert('Failed to upload variant image: ' + err.message);
        } finally {
            setUploadingVariantIndex(null);
        }
    };

    const handleApplyImageToColorGroup = (colorName, imageUrl, imageAlt) => {
        if (!colorName || !imageUrl) return;
        setFormData(prev => {
            const updated = (prev.variants || []).map(v => {
                if ((v.color || '').trim().toLowerCase() === colorName.trim().toLowerCase()) {
                    return { ...v, image: imageUrl, imageAlt: imageAlt || v.imageAlt || `${v.color} variant` };
                }
                return v;
            });
            return { ...prev, variants: updated };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const isValidUrlFormat = (url) => {
        if (!url) return false;
        return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
    };

    return (
        <div className="product-form-container">
            <div className="form-header">
                <button type="button" onClick={onCancel} className="btn-back">
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
                                <label>Category *</label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId || formData.category_id || ''}
                                    onChange={handleCategoryChange}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Subcategory</label>
                                <select
                                    name="subcategoryId"
                                    value={formData.subcategoryId || ''}
                                    onChange={handleSubcategoryChange}
                                    disabled={!formData.categoryId && !formData.category_id}
                                >
                                    <option value="">Select Subcategory</option>
                                    {subcategories.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
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
                        <h3>Main Product Media</h3>
                        <div className="image-upload-box">
                            <div className="preview-area">
                                {formData.image ? (
                                    <img src={formData.image} alt="Main Preview" className="img-preview" />
                                ) : (
                                    <div className="placeholder-preview">
                                        <Camera size={48} />
                                        <p>No main image set</p>
                                    </div>
                                )}
                            </div>
                            <div className="upload-controls">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>Image URL</label>
                                <input
                                    type="text"
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                                <div style={{ marginTop: '0.75rem' }}>
                                    <label className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <Upload size={16} /> {uploadingMain ? 'Uploading...' : 'Upload Main Image'}
                                        <input type="file" accept="image/*" onChange={handleMainFileUpload} style={{ display: 'none' }} disabled={uploadingMain} />
                                    </label>
                                </div>
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

                    {/* 🔹 Variants Section */}
                    <div className="form-section full-width">
                        <div className="section-header-flex">
                            <div>
                                <h3>Product Variants</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                    Each variant supports an independent image. Sizes sharing the same color can inherit or share the color image.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn-add-variant"
                                onClick={() => {
                                    const newVariant = {
                                        id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                        size: '',
                                        color: '',
                                        stock: 0,
                                        price: '',
                                        price_override: '',
                                        sku: '',
                                        image: '',
                                        imageAlt: ''
                                    };
                                    setFormData(prev => ({
                                        ...prev,
                                        variants: [...(prev.variants || []), newVariant]
                                    }));
                                }}
                            >
                                + Add Variant
                            </button>
                        </div>

                        <div className="variants-list">
                            {(formData.variants || []).map((variant, index) => {
                                const isUploadingThis = uploadingVariantIndex === index;
                                const isInvalidUrl = invalidImageUrls[index];
                                const hasValidUrlFormat = isValidUrlFormat(variant.image);

                                return (
                                    <div key={index} className="variant-card">
                                        <div className="variant-card-header">
                                            <span className="variant-badge">Variant #{index + 1}</span>
                                            <button
                                                type="button"
                                                className="btn-delete-variant"
                                                title="Delete Variant"
                                                onClick={() => {
                                                    const updated = formData.variants.filter((_, i) => i !== index);
                                                    setFormData(prev => ({ ...prev, variants: updated }));
                                                }}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <div className="variant-inputs-grid">
                                            <div className="form-group">
                                                <label>Color</label>
                                                <input
                                                    type="text"
                                                    placeholder="Black, Blue, Red..."
                                                    value={variant.color || ''}
                                                    onChange={(e) => {
                                                        const updated = [...formData.variants];
                                                        updated[index].color = e.target.value;
                                                        setFormData(prev => ({ ...prev, variants: updated }));
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Size</label>
                                                <input
                                                    type="text"
                                                    placeholder="S, M, L, XL..."
                                                    value={variant.size || ''}
                                                    onChange={(e) => {
                                                        const updated = [...formData.variants];
                                                        updated[index].size = e.target.value;
                                                        setFormData(prev => ({ ...prev, variants: updated }));
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Variant Stock</label>
                                                <input
                                                    type="number"
                                                    value={variant.stock !== undefined ? variant.stock : ''}
                                                    onChange={(e) => {
                                                        const updated = [...formData.variants];
                                                        updated[index].stock = e.target.value;
                                                        setFormData(prev => ({ ...prev, variants: updated }));
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Price Override (₹)</label>
                                                <input
                                                    type="number"
                                                    placeholder="Default to base price"
                                                    value={variant.price_override !== undefined ? variant.price_override : (variant.price || '')}
                                                    onChange={(e) => {
                                                        const updated = [...formData.variants];
                                                        updated[index].price_override = e.target.value;
                                                        updated[index].price = e.target.value;
                                                        setFormData(prev => ({ ...prev, variants: updated }));
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Variant SKU</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. TSHIRT-RED-M"
                                                    value={variant.sku || ''}
                                                    onChange={(e) => {
                                                        const updated = [...formData.variants];
                                                        updated[index].sku = e.target.value;
                                                        setFormData(prev => ({ ...prev, variants: updated }));
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* 📷 Variant Image Field Component */}
                                        <div className="variant-image-section">
                                            <div className="variant-image-header">
                                                <label className="variant-image-title">
                                                    <ImageIcon size={16} /> Variant Image
                                                </label>
                                                {variant.color && variant.image && (
                                                    <button
                                                        type="button"
                                                        className="btn-color-sync"
                                                        onClick={() => handleApplyImageToColorGroup(variant.color, variant.image, variant.imageAlt)}
                                                        title={`Apply image to all ${variant.color} variants`}
                                                    >
                                                        <Copy size={13} /> Apply to all {variant.color} variants
                                                    </button>
                                                )}
                                            </div>

                                            <div className="variant-image-body">
                                                <div className="variant-img-preview-box">
                                                    {variant.image && !isInvalidUrl ? (
                                                        <img
                                                            src={variant.image}
                                                            alt={variant.imageAlt || 'Variant Preview'}
                                                            className="variant-thumb"
                                                            onError={() => setInvalidImageUrls(prev => ({ ...prev, [index]: true }))}
                                                        />
                                                    ) : (
                                                        <div className="variant-thumb-placeholder">
                                                            <ImageIcon size={24} />
                                                            <span>{isInvalidUrl ? 'Invalid URL' : 'No Image'}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="variant-img-controls">
                                                    <div className="url-input-row">
                                                        <input
                                                            type="text"
                                                            placeholder="Paste image URL (https://...)"
                                                            value={variant.image || ''}
                                                            onChange={(e) => {
                                                                const updated = [...formData.variants];
                                                                updated[index].image = e.target.value;
                                                                setFormData(prev => ({ ...prev, variants: updated }));
                                                                setInvalidImageUrls(prev => ({ ...prev, [index]: false }));
                                                            }}
                                                            className="variant-url-input"
                                                        />

                                                        <label className="btn-upload-label" title="Upload from Device">
                                                            {isUploadingThis ? <RefreshCw size={15} className="spinner" /> : <Upload size={15} />}
                                                            <span>{isUploadingThis ? 'Uploading...' : 'Upload'}</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleVariantFileUpload(index, e)}
                                                                style={{ display: 'none' }}
                                                                disabled={isUploadingThis}
                                                            />
                                                        </label>
                                                    </div>

                                                    <div className="url-input-row" style={{ marginTop: '0.5rem' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Alt text (e.g. Front view of Red shirt)"
                                                            value={variant.imageAlt || ''}
                                                            onChange={(e) => {
                                                                const updated = [...formData.variants];
                                                                updated[index].imageAlt = e.target.value;
                                                                setFormData(prev => ({ ...prev, variants: updated }));
                                                            }}
                                                            className="variant-alt-input"
                                                        />

                                                        {variant.image && (
                                                            <button
                                                                type="button"
                                                                className="btn-remove-img"
                                                                onClick={() => {
                                                                    const updated = [...formData.variants];
                                                                    updated[index].image = '';
                                                                    updated[index].imageAlt = '';
                                                                    setFormData(prev => ({ ...prev, variants: updated }));
                                                                    setInvalidImageUrls(prev => ({ ...prev, [index]: false }));
                                                                }}
                                                                title="Remove Image"
                                                            >
                                                                <Trash2 size={14} /> Remove
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Validation feedback */}
                                                    {variant.image && (
                                                        <div className="image-validation-badge">
                                                            {isInvalidUrl ? (
                                                                <span className="badge-error"><AlertTriangle size={13} /> Image failed to load. Check URL.</span>
                                                            ) : hasValidUrlFormat ? (
                                                                <span className="badge-valid"><CheckCircle size={13} /> Valid Image URL</span>
                                                            ) : (
                                                                <span className="badge-warning"><AlertTriangle size={13} /> URL should begin with http:// or https://</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!formData.variants || formData.variants.length === 0) && (
                                <p className="text-dim">No variants added. Product will be sold as a single unit.</p>
                            )}
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

import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Upload } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import './AdminLayout.css';
import './HeroSlides.css';

const HeroSlides = () => {
    const [slides, setSlides] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentSlideId, setCurrentSlideId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        manualImage: '',
        active: true
    });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/hero-slides`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSlides(data);
        } catch (err) {
            console.error("Error fetching slides:", err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const data = new FormData();
        data.append('title', formData.title);
        data.append('subtitle', formData.subtitle);
        data.append('description', formData.description);
        data.append('manualImage', formData.manualImage);
        data.append('active', formData.active);
        if (imageFile) {
            data.append('image', imageFile);
        }

        const url = editMode
            ? `${API_BASE_URL}/api/admin/hero-slides/${currentSlideId}`
            : `${API_BASE_URL}/api/admin/hero-slides`;
        const method = editMode ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });
            if (res.ok) {
                fetchSlides();
                closeModal();
            } else {
                alert('Failed to save slide');
            }
        } catch (err) {
            console.error("Error saving slide:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this slide?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/hero-slides/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchSlides();
        } catch (err) {
            console.error(err);
        }
    };

    const openEditModal = (slide) => {
        setEditMode(true);
        setCurrentSlideId(slide.id);
        setFormData({
            title: slide.title,
            subtitle: slide.subtitle,
            description: slide.description,
            manualImage: slide.image.startsWith('/uploads') ? '' : slide.image,
            active: slide.active === 1
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditMode(false);
        setCurrentSlideId(null);
        setFormData({ title: '', subtitle: '', description: '', manualImage: '', active: true });
        setImageFile(null);
    };

    return (
        <div className="admin-content">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-title">Hero Slides</h1>
                    <p className="admin-subtitle">Manage homepage carousel images and text</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} /> Add New Slide
                </button>
            </div>

            <div className="slides-grid">
                {slides.map(slide => (
                    <div key={slide.id} className={`slide-card ${slide.active ? '' : 'inactive'}`}>
                        <div className="slide-image-wrapper">
                            <img
                                src={slide.image.startsWith('/') ? `${API_BASE_URL}${slide.image}` : slide.image}
                                alt={slide.title}
                                className="slide-img"
                            />
                            {!slide.active && <span className="inactive-badge">Inactive</span>}
                        </div>
                        <div className="slide-details">
                            <h4>{slide.title}</h4>
                            <p className="slide-sub">{slide.subtitle}</p>
                            <div className="slide-actions">
                                <button className="icon-btn" onClick={() => openEditModal(slide)}>
                                    <Pencil size={16} />
                                </button>
                                <button className="icon-btn delete" onClick={() => handleDelete(slide.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editMode ? 'Edit Slide' : 'New Slide'}</h3>
                            <button className="close-btn" onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="slide-form">
                            <div className="form-group">
                                <label>Subtitle (Small Top Text)</label>
                                <input
                                    type="text"
                                    name="subtitle"
                                    value={formData.subtitle}
                                    onChange={handleInputChange}
                                    placeholder="e.g. NEW ARRIVALS"
                                />
                            </div>
                            <div className="form-group">
                                <label>Title (Big Heading)</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Use \n for line breaks"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label>Image</label>
                                <div className="image-input-tabs">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="file-input"
                                    />
                                    <p className="or-divider">- OR -</p>
                                    <input
                                        type="text"
                                        name="manualImage"
                                        value={formData.manualImage}
                                        onChange={handleInputChange}
                                        placeholder="Paste image URL directly"
                                        className="url-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="active"
                                        checked={formData.active}
                                        onChange={handleInputChange}
                                    />
                                    Active (Visible on Homepage)
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary w-100">
                                {editMode ? 'Update Slide' : 'Create Slide'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroSlides;

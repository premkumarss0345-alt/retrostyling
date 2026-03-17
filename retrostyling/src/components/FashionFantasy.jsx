import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/firestoreService';
import './FashionFantasy.css';

const FashionFantasy = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (err) {
            console.error('Error fetching categories for fantasy section:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null; // Or a skeleton
    if (categories.length === 0) return null;

    return (
        <section className="category section">
            <div className="container">
                <ul className="category-list">
                    {categories.map((cat, i) => (
                        <li key={i} className="category-item">
                            <figure className="category-banner">
                                <img src={cat.image} alt={cat.title} className="w-100" />
                            </figure>
                            <a href={`/category/${cat.slug}`} className="btn btn-secondary">{cat.title}</a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default FashionFantasy;

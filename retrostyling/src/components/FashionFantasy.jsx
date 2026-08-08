import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryService, subcategoryService } from '../services/firestoreService';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import './FashionFantasy.css';

const FashionFantasy = () => {
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategoriesData();
    }, []);

    const loadCategoriesData = async () => {
        try {
            const [cats, subs] = await Promise.all([
                categoryService.getAll(),
                subcategoryService.getAll()
            ]);
            setCategories(cats || []);
            setSubcategories(subs || []);
        } catch (err) {
            console.error('Error fetching categories for Shop by Category section:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="shop-by-category-section">
                <div className="container">
                    <div className="category-skeleton-grid">
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} className="category-card-skeleton" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (categories.length === 0) return null;

    return (
        <section className="shop-by-category-section">
            <div className="container">
                <div className="shop-category-grid">
                    {categories.map((cat, idx) => {
                        const catSubs = subcategories.filter(s => s.categoryId === cat.id || s.categorySlug === cat.slug);
                        const catName = cat.name || cat.title || 'Collection';
                        const catImg = cat.image || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80';

                        return (
                            <motion.div
                                key={cat.id || idx}
                                className="category-card"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: idx * 0.08 }}
                            >
                                <div className="category-image-wrap">
                                    <img src={catImg} alt={catName} className="category-img" loading="lazy" />
                                    <div className="category-overlay" />
                                </div>

                                <div className="category-card-content">
                                    <div className="category-header-tag">
                                        <Sparkles size={14} className="sparkle-icon" />
                                        <span>Category</span>
                                    </div>

                                    <h3 className="category-card-name">{catName}</h3>

                                    {cat.description && (
                                        <p className="category-card-desc">{cat.description}</p>
                                    )}

                                    {catSubs.length > 0 && (
                                        <div className="category-subs-pills">
                                            {catSubs.slice(0, 4).map(sub => (
                                                <Link
                                                    key={sub.id}
                                                    to={`/shop/${cat.slug}/${sub.slug}`}
                                                    className="sub-pill"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                            {catSubs.length > 4 && (
                                                <span className="sub-pill sub-pill-more">+{catSubs.length - 4} more</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="category-card-action">
                                        <Link to={`/category/${cat.slug}`} className="btn-shop-category">
                                            Shop {catName} <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FashionFantasy;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { API_BASE_URL } from '../config';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import './Category.css';

const CategoryPage = () => {
    const { slug } = useParams();
    const [products, setProducts] = useState([]);
    const [categoryDetails, setCategoryDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategoryData = async () => {
            setLoading(true);
            try {
                // Fetch products for this category
                const productRes = await fetch(`${API_BASE_URL}/api/products?category=${slug}`);
                if (!productRes.ok) throw new Error('Failed to fetch products');
                const productData = await productRes.json();
                setProducts(productData);

                // Fetch category details from the list of categories
                const catRes = await fetch(`${API_BASE_URL}/api/categories`);
                if (catRes.ok) {
                    const categories = await catRes.json();
                    const currentCat = categories.find(c => c.slug === slug);
                    if (currentCat) {
                        setCategoryDetails(currentCat);
                    }
                }
            } catch (err) {
                console.error("Error fetching category data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchCategoryData();
        }
    }, [slug]);

    const displayName = (slug || '').replace(/-/g, ' ').toUpperCase() || 'COLLECTION';

    return (
        <div className="category-page">
            {/* Cinematic Hero Section */}
            <section className="category-hero">
                <motion.div
                    className="category-hero-bg"
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    style={{
                        backgroundImage: `url(${categoryDetails?.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070'})`
                    }}
                />
                <div className="category-hero-overlay" />

                <div className="container">


                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        {displayName}
                    </motion.h1>

                    <motion.p
                        className="item-count"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        {products.length} PREMIUM PIECES
                    </motion.p>
                </div>
            </section>

            <div className="container category-content">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            className="category-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="category-loader"></div>
                            <p className="text-dim">UNVEILING THE COLLECTION...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="category-grid-header">
                                <span className="results-count">DISPLAYING {products.length} RESULTS</span>
                                <div className="grid-controls">
                                    {/* Additional controls like sorting could go here */}
                                </div>
                            </div>

                            {products.length > 0 ? (
                                <div className="category-product-grid">
                                    {products.map((product, index) => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <ProductCard product={product} />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    className="category-no-products"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <h3>Vault Empty</h3>
                                    <p>Our {displayName} archives are currently being updated. Check back soon for new arrivals.</p>
                                    <Link to="/shop" className="btn btn-primary">
                                        <ArrowLeft size={18} style={{ marginRight: '8px' }} /> RETURN TO SHOP
                                    </Link>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CategoryPage;

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config';
import ProductCard from './ProductCard';
import './ProductCarousel.css';

const ProductCarousel = ({ title, fetchUrl }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const carouselRef = useRef(null);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                // Ensure fetchUrl is used if provided, otherwise default to API_BASE_URL/api/products
                const url = fetchUrl
                    ? (fetchUrl.startsWith('http') ? fetchUrl : `${API_BASE_URL}${fetchUrl}`)
                    : `${API_BASE_URL}/api/products`;

                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to fetch products');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setProducts(data.slice(0, 8));
                } else {
                    console.error('ProductCarousel: Data is not an array', data);
                    setProducts([]);
                }
            } catch (err) {
                console.error("Failed to load carousel products", err);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, [fetchUrl]);

    const scroll = (direction) => {
        if (carouselRef.current) {
            const { current } = carouselRef;
            const scrollAmount = direction === 'left' ? -320 : 320;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (loading) return <div className="carousel-loading">Loading...</div>;
    if (products.length === 0) return null;

    return (
        <section className="product-carousel-section section">
            <div className="container">
                <div className="carousel-header">
                    <h2 className="title-lg">{title}</h2>
                    <div className="carousel-nav">
                        <button onClick={() => scroll('left')} className="nav-btn">
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={() => scroll('right')} className="nav-btn">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                <div className="carousel-viewport" ref={carouselRef}>
                    <motion.div
                        className="carousel-track"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        {products.map(product => (
                            <div key={product.id} className="carousel-item">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ProductCarousel;

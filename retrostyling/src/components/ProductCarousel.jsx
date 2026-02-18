import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import './ProductCarousel.css';

const ProductCarousel = ({ title, fetchUrl }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const carouselRef = useRef(null);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const res = await fetch(fetchUrl || 'http://localhost:5001/api/products');
                const data = await res.json();
                // If no specific fetchUrl, maybe slice for demo
                setProducts(data.slice(0, 8));
            } catch (err) {
                console.error("Failed to load carousel products", err);
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

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { productService } from '../services/firestoreService';
import ProductCard from './ProductCard';
import './ProductCarousel.css';

/**
 * ProductCarousel
 *
 * Props:
 *   title    - Section heading
 *   filter   - Object passed to productService.getAll()
 *             e.g. { isNew: true }  or  { sort: 'popular' }
 */
const ProductCarousel = ({ title, filter = {} }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const carouselRef             = useRef(null);

  useEffect(() => {
    loadProducts();
  }, [JSON.stringify(filter)]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll(filter);
      setProducts(data.slice(0, 10));
    } catch (err) {
      console.error('Failed to load carousel products', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (dir) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
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
            <button onClick={() => scroll('left')} className="nav-btn"><ChevronLeft size={24} /></button>
            <button onClick={() => scroll('right')} className="nav-btn"><ChevronRight size={24} /></button>
          </div>
        </div>

        <div className="carousel-viewport" ref={carouselRef}>
          <motion.div
            className="carousel-track"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {products.map((product) => (
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

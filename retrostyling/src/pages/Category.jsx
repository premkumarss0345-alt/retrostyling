import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productService, categoryService } from '../services/firestoreService';
import './Category.css';

const Category = () => {
  const { slug } = useParams();
  const [products, setProducts]     = useState([]);
  const [category, setCategory]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    loadCategory();
  }, [slug]);

  const loadCategory = async () => {
    setLoading(true);
    try {
      const [allCats, prods] = await Promise.all([
        categoryService.getAll(),
        productService.getAll({ category: slug }),
      ]);
      const cat = allCats.find((c) => c.slug === slug) || null;
      setCategory(cat);
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="category-loading">
        <div className="category-loader"></div>
        <p>REVEALING COLLECTION</p>
      </div>
    );
  }

  return (
    <div className="category-page">
      {/* Cinematic Hero */}
      <section className="category-hero">
        <div 
          className="category-hero-bg" 
          style={{ backgroundImage: category?.image ? `url(${category.image})` : 'none' }}
        ></div>
        <div className="category-hero-overlay"></div>
        <div className="container">
          <motion.div 
            className="category-hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
           
            <h1>{category?.name || slug}</h1>
            <div className="item-count">
              {products.length} {products.length === 1 ? 'ITEM' : 'ITEMS'} IN COLLECTION
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container category-content">
        <div className="category-grid-header">
          <div className="results-count">
            SHOWING {products.length} RESULTS
          </div>
          <div className="grid-controls">
            <button className="control-btn"><LayoutGrid size={18} /></button>
            <button className="control-btn"><SlidersHorizontal size={18} /></button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {products.length === 0 ? (
            <motion.div 
              className="category-no-products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3>STILL IN DESIGN...</h3>
              <p>We are currently curating new pieces for this collection. Check back soon for the latest drops.</p>
              <Link to="/shop" className="btn btn-primary">EXPLORE ALL PRODUCTS</Link>
            </motion.div>
          ) : (
            <motion.div
              className="category-product-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Category;

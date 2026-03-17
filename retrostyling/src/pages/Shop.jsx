import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { productService, categoryService } from '../services/firestoreService';
import './Shop.css';

const Shop = () => {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearch]     = useState('');
  const [activeCategory, setActiveCat] = useState('');
  const [sortBy, setSortBy]         = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeCategory, sortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productService.getAll({ category: activeCategory || undefined, sort: sortBy }),
        categoryService.getAll(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="shop-page section">
      <div className="container">
        <div className="shop-header">
          <div>
            <h1 className="h2">Shop All</h1>
            <p className="text-light">{filtered.length} products found</p>
          </div>
          <div className="shop-controls">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
              />
              {searchTerm && <button onClick={() => setSearch('')}><X size={16} /></button>}
            </div>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="popular">Popular</option>
            </select>
          </div>
        </div>

        {/* Category Chips */}
        <div className="category-chips">
          <button
            className={`chip ${!activeCategory ? 'active' : ''}`}
            onClick={() => setActiveCat('')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`chip ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => setActiveCat(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="center-loading" style={{ padding: '4rem 0' }}>Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p>No products found. Try a different search or category.</p>
          </div>
        ) : (
          <motion.div
            className="products-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Shop;

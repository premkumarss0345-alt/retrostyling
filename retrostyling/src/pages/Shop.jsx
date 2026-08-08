import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronRight, Filter, Check, Star, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { productService, categoryService, subcategoryService } from '../services/firestoreService';
import './Shop.css';

const Shop = () => {
  const { categorySlug, subcategorySlug, slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCatSlug = categorySlug || slug || searchParams.get('category') || '';
  const activeSubSlug = subcategorySlug || searchParams.get('subcategory') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentSubcategory, setCurrentSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Advanced Filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);

  useEffect(() => {
    loadCategoryDataAndProducts();
  }, [activeCatSlug, activeSubSlug, sortBy, minPrice, maxPrice, selectedBrand, selectedSize, selectedColor, inStockOnly, onSaleOnly]);

  const loadCategoryDataAndProducts = async () => {
    setLoading(true);
    try {
      // 1. Fetch categories and active subcategories
      const [allCats, allSubs] = await Promise.all([
        categoryService.getAll(),
        subcategoryService.getAll(),
      ]);

      setCategories(allCats);
      setSubcategories(allSubs);

      let catObj = null;
      let subObj = null;

      if (activeCatSlug) {
        catObj = allCats.find(c => c.slug === activeCatSlug) || await categoryService.getBySlug(activeCatSlug);
      }
      if (activeCatSlug && activeSubSlug) {
        subObj = allSubs.find(s => s.categorySlug === activeCatSlug && s.slug === activeSubSlug) || 
                 await subcategoryService.getByCategorySlugAndSubSlug(activeCatSlug, activeSubSlug);
      }

      setCurrentCategory(catObj);
      setCurrentSubcategory(subObj);

      // 2. Direct Firestore query using categoryId and subcategoryId
      const prods = await productService.getAll({
        categoryId: catObj?.id,
        subcategoryId: subObj?.id,
        categorySlug: activeCatSlug,
        subcategorySlug: activeSubSlug,
        search: searchTerm,
        sort: sortBy,
        minPrice,
        maxPrice,
        brand: selectedBrand,
        size: selectedSize,
        color: selectedColor,
        inStock: inStockOnly,
        onSale: onSaleOnly,
      });

      setProducts(prods);

      // 3. Dynamic SEO Metadata Update
      const pageTitle = subObj?.seoTitle || catObj?.seoTitle || (subObj ? `${subObj.name} | RetroStylings` : catObj ? `${catObj.name} | RetroStylings` : 'Shop All Products | RetroStylings');
      const pageDesc = subObj?.seoDescription || catObj?.seoDescription || 'Discover premium retro clothing, dresses, tops, jackets, and fashion accessories.';
      
      document.title = pageTitle;
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', pageDesc);

    } catch (err) {
      console.error('Shop loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrand('');
    setSelectedSize('');
    setSelectedColor('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSearchTerm('');
  };

  const currentCategorySubs = currentCategory
    ? subcategories.filter(s => s.categoryId === currentCategory.id)
    : [];

  const bannerImg = currentSubcategory?.image || currentCategory?.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop';
  const pageHeading = currentSubcategory?.name || currentCategory?.name || 'Shop Collection';
  const pageDescription = currentSubcategory?.description || currentCategory?.description || 'Browse our complete catalog of handpicked premium fashion.';

  return (
    <div className="shop-page section">
      <div className="container">
        
        {/* Breadcrumb Navigation */}
        <nav className="shop-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/shop">Shop</Link>
          {currentCategory && (
            <>
              <ChevronRight size={14} />
              <Link to={`/shop/${currentCategory.slug}`}>{currentCategory.name}</Link>
            </>
          )}
          {currentSubcategory && (
            <>
              <ChevronRight size={14} />
              <span className="current">{currentSubcategory.name}</span>
            </>
          )}
        </nav>

        {/* Dynamic Category Hero Banner */}
        <div className="shop-hero-banner glass-card" style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.3)), url(${bannerImg})` }}>
          <div className="hero-banner-content">
            <h1 className="h1">{pageHeading}</h1>
            <p className="hero-desc">{pageDescription}</p>
            <div className="hero-count-tag">
              {products.length} {products.length === 1 ? 'ITEM' : 'ITEMS'} AVAILABLE
            </div>
          </div>
        </div>

        {/* Dynamic Subcategory Chips Bar */}
        {currentCategory && currentCategorySubs.length > 0 && (
          <div className="subcategory-chips-bar">
            <Link
              to={`/shop/${currentCategory.slug}`}
              className={`chip ${!activeSubSlug ? 'active' : ''}`}
            >
              All {currentCategory.name}
            </Link>
            {currentCategorySubs.map((sub) => (
              <Link
                key={sub.id}
                to={`/shop/${currentCategory.slug}/${sub.slug}`}
                className={`chip ${activeSubSlug === sub.slug ? 'active' : ''}`}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        {/* Shop Controls Header */}
        <div className="shop-header">
          <div className="shop-controls-left">
            <button
              className={`btn btn-outline filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={18} /> Filters {showFilters ? 'Off' : 'On'}
            </button>
            <span className="results-count-text">{products.length} Products Found</span>
          </div>

          <div className="shop-controls">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search within collection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && <button onClick={() => setSearchTerm('')}><X size={16} /></button>}
            </div>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest Drops</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="popular">Popularity</option>
            </select>
          </div>
        </div>

        <div className="shop-main-layout">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                className="shop-sidebar-filters glass-card"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <div className="sidebar-header">
                  <h3><Filter size={18} /> Refine Products</h3>
                  <button className="text-btn-clear" onClick={handleClearFilters}>Clear All</button>
                </div>

                {/* Categories Accordion Filter */}
                <div className="filter-block">
                  <h4>Category</h4>
                  <ul className="sidebar-cat-list">
                    <li>
                      <Link to="/shop" className={!activeCatSlug ? 'active' : ''}>All Categories</Link>
                    </li>
                    {categories.map((c) => (
                      <li key={c.id}>
                        <Link to={`/shop/${c.slug}`} className={activeCatSlug === c.slug ? 'active' : ''}>
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price Range Filter */}
                <div className="filter-block">
                  <h4>Price Range (₹)</h4>
                  <div className="price-inputs">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Size Filter */}
                <div className="filter-block">
                  <h4>Size</h4>
                  <div className="size-options-grid">
                    {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                      <button
                        key={sz}
                        className={`size-btn ${selectedSize === sz ? 'active' : ''}`}
                        onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkbox Toggles */}
                <div className="filter-block">
                  <h4>Availability & Sale</h4>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                    In Stock Only
                  </label>
                  <label className="checkbox-label" style={{ marginTop: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={(e) => setOnSaleOnly(e.target.checked)}
                    />
                    On Sale Items
                  </label>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          <div className="shop-grid-container" style={{ flex: 1 }}>
            {loading ? (
              <div className="center-loading" style={{ padding: '5rem 0', textAlign: 'center' }}>
                <RefreshCw size={28} className="spinner" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                <p>Curating collection...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h3>No Products Found</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>
                  No items match your active filter criteria for this category.
                </p>
                <button className="btn btn-primary" onClick={handleClearFilters}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <motion.div
                className="products-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Shop;

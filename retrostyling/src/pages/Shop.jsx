import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronRight, Filter, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { productService, categoryService, subcategoryService, labelService } from '../services/firestoreService';
import './Shop.css';

const Shop = () => {
  const { categorySlug, subcategorySlug, slug } = useParams();
  const [searchParams] = useSearchParams();

  const activeCatSlug = categorySlug || slug || searchParams.get('category') || '';
  const activeSubSlug = subcategorySlug || searchParams.get('subcategory') || '';

  const [products, setProducts]               = useState([]);
  const [categories, setCategories]           = useState([]);
  const [subcategories, setSubcategories]     = useState([]);
  const [labels, setLabels]                   = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentSubcategory, setCurrentSubcategory] = useState(null);
  const [loading, setLoading]                 = useState(true);

  // Search & Sort
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy]         = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Filter values — "pending" copies used in mobile drawer before Apply
  const [minPrice, setMinPrice]         = useState('');
  const [maxPrice, setMaxPrice]         = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [inStockOnly, setInStockOnly]   = useState(false);
  const [onSaleOnly, setOnSaleOnly]     = useState(false);

  // Mobile pending state (held until Apply is tapped)
  const [pendingMin, setPendingMin]         = useState('');
  const [pendingMax, setPendingMax]         = useState('');
  const [pendingSize, setPendingSize]       = useState('');
  const [pendingLabel, setPendingLabel]     = useState('');
  const [pendingStock, setPendingStock]     = useState(false);
  const [pendingSale, setPendingSale]       = useState(false);

  const isMobileWidth = () => typeof window !== 'undefined' && window.innerWidth <= 768;

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (showFilters && isMobileWidth()) {
      document.body.style.overflow = 'hidden';
      // Sync pending state with current committed state
      setPendingMin(minPrice);
      setPendingMax(maxPrice);
      setPendingSize(selectedSize);
      setPendingLabel(selectedLabel);
      setPendingStock(inStockOnly);
      setPendingSale(onSaleOnly);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showFilters]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowFilters(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    loadCategoryDataAndProducts();
  }, [activeCatSlug, activeSubSlug, sortBy, minPrice, maxPrice, selectedSize, selectedLabel, inStockOnly, onSaleOnly]);

  const loadCategoryDataAndProducts = async () => {
    setLoading(true);
    try {
      const [allCats, allSubs, activeLbls] = await Promise.all([
        categoryService.getAll(),
        subcategoryService.getAll(),
        labelService.getActive(),
      ]);

      setCategories(allCats);
      setSubcategories(allSubs);
      setLabels(activeLbls);

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

      const prods = await productService.getAll({
        categoryId: catObj?.id,
        subcategoryId: subObj?.id,
        categorySlug: activeCatSlug,
        subcategorySlug: activeSubSlug,
        search: searchTerm,
        sort: sortBy,
        minPrice,
        maxPrice,
        size: selectedSize,
        inStock: inStockOnly,
        onSale: onSaleOnly,
      });

      let filteredProds = prods;
      if (selectedLabel) {
        filteredProds = prods.filter(p => (p.labelIds || []).includes(selectedLabel));
      }
      setProducts(filteredProds);

      const pageTitle = subObj?.seoTitle || catObj?.seoTitle || (subObj ? `${subObj.name} | RetroStylings` : catObj ? `${catObj.name} | RetroStylings` : 'Shop All Products | RetroStylings');
      const pageDesc  = subObj?.seoDescription || catObj?.seoDescription || 'Discover premium retro clothing, dresses, tops, jackets, and fashion accessories.';
      document.title  = pageTitle;
      const metaDesc  = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', pageDesc);

    } catch (err) {
      console.error('Shop loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setMinPrice(''); setMaxPrice('');
    setSelectedSize(''); setSelectedLabel('');
    setInStockOnly(false); setOnSaleOnly(false);
    setSearchTerm('');
  };

  // Mobile: apply pending → committed
  const handleMobileApply = () => {
    setMinPrice(pendingMin);
    setMaxPrice(pendingMax);
    setSelectedSize(pendingSize);
    setSelectedLabel(pendingLabel);
    setInStockOnly(pendingStock);
    setOnSaleOnly(pendingSale);
    setShowFilters(false);
  };

  // Mobile: clear pending state
  const handleMobileClear = () => {
    setPendingMin(''); setPendingMax('');
    setPendingSize(''); setPendingLabel('');
    setPendingStock(false); setPendingSale(false);
  };

  // Count active committed filters for badge
  const activeFilterCount = [
    minPrice, maxPrice, selectedSize, selectedLabel,
    inStockOnly && 'stock', onSaleOnly && 'sale',
  ].filter(Boolean).length;

  const currentCategorySubs = currentCategory
    ? subcategories.filter(s => s.categoryId === currentCategory.id)
    : [];

  const bannerImg       = currentSubcategory?.image || currentCategory?.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop';
  const pageHeading     = currentSubcategory?.name || currentCategory?.name || 'Shop Collection';
  const pageDescription = currentSubcategory?.description || currentCategory?.description || 'Browse our complete catalog of handpicked premium fashion.';

  /* ─── Shared filter content ─────────────────────────────────────────── */
  const renderFilterContent = (mobile = false) => {
    const size    = mobile ? pendingSize    : selectedSize;
    const label   = mobile ? pendingLabel   : selectedLabel;
    const stock   = mobile ? pendingStock   : inStockOnly;
    const sale    = mobile ? pendingSale    : onSaleOnly;
    const priceMin = mobile ? pendingMin    : minPrice;
    const priceMax = mobile ? pendingMax    : maxPrice;

    const setSize  = mobile ? setPendingSize  : setSelectedSize;
    const setLabel = mobile ? setPendingLabel : setSelectedLabel;
    const setStock = mobile ? setPendingStock : setInStockOnly;
    const setSale  = mobile ? setPendingSale  : setOnSaleOnly;
    const setPMin  = mobile ? setPendingMin   : setMinPrice;
    const setPMax  = mobile ? setPendingMax   : setMaxPrice;

    return (
      <>
        {/* Category */}
        <div className="filter-block">
          <h4>Category</h4>
          <ul className="sidebar-cat-list">
            <li><Link to="/shop" className={!activeCatSlug ? 'active' : ''} onClick={() => setShowFilters(false)}>All Categories</Link></li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/shop/${c.slug}`} className={activeCatSlug === c.slug ? 'active' : ''} onClick={() => setShowFilters(false)}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="filter-divider" />

        {/* Price Range */}
        <div className="filter-block">
          <h4>Price Range (₹)</h4>
          <div className="price-inputs">
            <input type="number" placeholder="Min" value={priceMin} onChange={(e) => setPMin(e.target.value)} />
            <span className="price-separator">–</span>
            <input type="number" placeholder="Max" value={priceMax} onChange={(e) => setPMax(e.target.value)} />
          </div>
        </div>

        <div className="filter-divider" />

        {/* Size */}
        <div className="filter-block">
          <h4>Size</h4>
          <div className="size-options-grid">
            {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
              <button
                key={sz}
                className={`size-btn ${size === sz ? 'active' : ''}`}
                onClick={() => setSize(size === sz ? '' : sz)}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Product Labels */}
        {labels.length > 0 && (
          <>
            <div className="filter-divider" />
            <div className="filter-block">
              <h4>Product Labels</h4>
              <div className="label-filter-pills">
                <button
                  className={`label-filter-btn ${!label ? 'active' : ''}`}
                  onClick={() => setLabel('')}
                >
                  All
                </button>
                {labels.map((lbl) => (
                  <button
                    key={lbl.id}
                    className={`label-filter-btn ${label === lbl.id ? 'active' : ''}`}
                    style={{
                      backgroundColor: label === lbl.id ? (lbl.bgColor || '#8B5CF6') : 'rgba(255,255,255,0.05)',
                      color: label === lbl.id ? (lbl.textColor || '#FFFFFF') : 'var(--text-secondary, #94a3b8)',
                      borderColor: lbl.bgColor || '#8B5CF6',
                    }}
                    onClick={() => setLabel(label === lbl.id ? '' : lbl.id)}
                  >
                    {lbl.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="filter-divider" />

        {/* Availability toggles */}
        <div className="filter-block">
          <h4>Availability & Sale</h4>
          <div className="filter-toggles">
            <div className="filter-toggle-row" onClick={() => setStock(!stock)}>
              <span>In Stock Only</span>
              <div className={`toggle-switch ${stock ? 'on' : ''}`}>
                <div className="toggle-knob" />
              </div>
            </div>
            <div className="filter-toggle-row" onClick={() => setSale(!sale)}>
              <span>On Sale Items</span>
              <div className={`toggle-switch ${sale ? 'on' : ''}`}>
                <div className="toggle-knob" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="shop-page section">
      <SEO
        title={pageHeading !== 'Shop Collection' ? `${pageHeading} | Men's Fashion` : "Shop All Men's Clothing & Essentials"}
        description={pageDescription}
        canonical={activeCatSlug ? `/category/${activeCatSlug}` : '/shop'}
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": pageHeading,
          "description": pageDescription,
          "url": typeof window !== 'undefined' ? window.location.href : '',
          "mainEntity": {
            "@type": "ItemList",
            "itemListElement": products.slice(0, 10).map((prod, idx) => ({
              "@type": "ListItem",
              "position": idx + 1,
              "url": typeof window !== 'undefined' ? `${window.location.origin}/product/${prod.slug || prod.id}` : ''
            }))
          }
        }}
      />
      <div className="container">

        {/* Breadcrumb */}
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

        {/* Hero Banner */}
        <div className="shop-hero-banner glass-card" style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.3)), url(${bannerImg})` }}>
          <div className="hero-banner-content">
            <h1 className="h1">{pageHeading}</h1>
            <p className="hero-desc">{pageDescription}</p>
            <div className="hero-count-tag">
              {products.length} {products.length === 1 ? 'ITEM' : 'ITEMS'} AVAILABLE
            </div>
          </div>
        </div>

        {/* Subcategory Chips */}
        {currentCategory && currentCategorySubs.length > 0 && (
          <div className="subcategory-chips-bar">
            <Link to={`/shop/${currentCategory.slug}`} className={`chip ${!activeSubSlug ? 'active' : ''}`}>
              All {currentCategory.name}
            </Link>
            {currentCategorySubs.map((sub) => (
              <Link key={sub.id} to={`/shop/${currentCategory.slug}/${sub.slug}`} className={`chip ${activeSubSlug === sub.slug ? 'active' : ''}`}>
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
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={18} />
              Filters
              {activeFilterCount > 0 && (
                <span className="filter-count-badge">{activeFilterCount}</span>
              )}
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
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest Drops</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="popular">Popularity</option>
            </select>
          </div>
        </div>

        <div className="shop-main-layout">

          {/* ── DESKTOP SIDEBAR ───────────────────────────────────── */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                className="shop-sidebar-filters glass-card desktop-sidebar"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <div className="sidebar-header">
                  <h3><Filter size={18} /> Refine Products</h3>
                  <button className="text-btn-clear" onClick={handleClearFilters}>Clear All</button>
                </div>
                {renderFilterContent(false)}
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── MOBILE BOTTOM-SHEET DRAWER ────────────────────────── */}
          <AnimatePresence>
            {showFilters && (
              <>
                {/* Backdrop */}
                <motion.div
                  className="mobile-filter-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  onClick={() => setShowFilters(false)}
                  aria-hidden="true"
                />

                {/* Drawer */}
                <motion.div
                  className="mobile-filter-drawer"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                >
                  {/* Drag handle pill */}
                  <div className="drawer-handle" />

                  {/* Drawer header */}
                  <div className="drawer-header">
                    <div className="drawer-header-left">
                      <Filter size={18} />
                      <span>Filter Products</span>
                      {(pendingSize || pendingLabel || pendingStock || pendingSale || pendingMin || pendingMax) && (
                        <span className="drawer-active-dot" />
                      )}
                    </div>
                    <button className="drawer-close-btn" onClick={() => setShowFilters(false)} aria-label="Close filters">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Scrollable filter content */}
                  <div className="drawer-body">
                    {renderFilterContent(true)}
                  </div>

                  {/* Sticky footer */}
                  <div className="drawer-footer">
                    <button className="drawer-btn-clear" onClick={handleMobileClear}>
                      Clear All
                    </button>
                    <button className="drawer-btn-apply" onClick={handleMobileApply}>
                      <Check size={16} />
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              </>
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
                <button className="btn btn-primary" onClick={handleClearFilters}>Clear All Filters</button>
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

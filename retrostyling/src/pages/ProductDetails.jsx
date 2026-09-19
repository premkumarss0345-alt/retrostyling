import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Heart, Truck, RotateCcw, ShieldCheck, ExternalLink, MessageSquare, ShoppingCart, ZoomIn, X, Star, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { productService, cartService, wishlistService, labelService } from '../services/firestoreService';
import { useAuth } from '../services/AuthContext';
import Toast from '../components/Toast';
import SEO, { SITE_URL } from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import './ProductDetails.css';

const ProductDetails = () => {
  const { slug }           = useParams();
  const navigate           = useNavigate();
  const { currentUser }    = useAuth();
  const galleryRef         = useRef(null);

  const [product, setProduct]           = useState(null);
  const [activeLabels, setActiveLabels] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedSize, setSelectedSize]     = useState('');
  const [selectedColor, setSelectedColor]   = useState('');
  const [quantity, setQuantity]         = useState(1);
  const [adding, setAdding]             = useState(false);
  const [toast, setToast]               = useState({ show: false, message: '', type: 'success' });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Touch swipe support
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX]     = useState(null);

  const openLightbox  = () => setLightboxOpen(true);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  // Collect all distinct product images for slideshow & SEO
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.image && typeof product.image === 'string') list.push(product.image);
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && typeof img === 'string' && !list.includes(img)) list.push(img);
      });
    }
    if (Array.isArray(product.variants)) {
      product.variants.forEach((v) => {
        if (v?.image && typeof v.image === 'string' && !list.includes(v.image)) list.push(v.image);
      });
    }
    return list.length > 0 ? list : ['/logo.png'];
  }, [product]);

  // Active slide image URL
  const currentSlideImage = galleryImages[activeImageIndex] || galleryImages[0] || product?.image || '/logo.png';

  const nextSlide = useCallback((e) => {
    if (e) e.stopPropagation();
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const prevSlide = useCallback((e) => {
    if (e) e.stopPropagation();
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const selectSlide = (index, e) => {
    if (e) e.stopPropagation();
    if (index >= 0 && index < galleryImages.length) {
      setActiveImageIndex(index);
    }
  };

  // Keyboard navigation for lightbox & gallery
  useEffect(() => {
    const onKey = (e) => {
      if (lightboxOpen) {
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowRight') nextSlide();
        else if (e.key === 'ArrowLeft') prevSlide();
      }
    };
    document.addEventListener('keydown', onKey);
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, closeLightbox, nextSlide, prevSlide]);

  // Touch Swipe handlers
  const minSwipeDistance = 45;
  const onTouchStart = (e) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const variantForColor = product?.variants?.find((v) => v.color === color && v.image);
    if (variantForColor && variantForColor.image) {
      const idx = galleryImages.indexOf(variantForColor.image);
      if (idx !== -1) {
        setActiveImageIndex(idx);
      }
    }
    if (window.innerWidth <= 768 && galleryRef.current) {
      galleryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    if (window.innerWidth <= 768 && galleryRef.current) {
      galleryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    labelService.getActive().then(setActiveLabels).catch(() => setActiveLabels([]));
  }, []);

  useEffect(() => { loadProduct(); }, [slug]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const data = await productService.getBySlug(slug);
      setProduct(data);
      setActiveImageIndex(0);
      if (data?.variants?.length > 0) {
        setSelectedSize(data.variants[0].size || '');
        setSelectedColor(data.variants[0].color || '');
      }

      // Load related products based on category
      if (data) {
        try {
          const related = await productService.getAll({
            categoryId: data.categoryId,
            categorySlug: data.categorySlug || data.category,
          });
          const filtered = related.filter((p) => p.id !== data.id && p.slug !== data.slug).slice(0, 4);
          setRelatedProducts(filtered);
        } catch (rErr) {
          console.warn('Could not load related products:', rErr);
        }
      }
    } catch (err) {
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      const activeVariant = product.variants?.find(
        (v) => v.size === selectedSize && v.color === selectedColor
      ) || null;
      await cartService.addItem(product, activeVariant, quantity);
      setToast({ show: true, message: '✓ Added to cart!', type: 'success' });
    } catch (err) {
      console.error('Cart error:', err);
      setToast({ show: true, message: 'Failed to add to cart', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!currentUser) { navigate('/login'); return; }
    try {
      await wishlistService.add(product.id);
      setToast({ show: true, message: '♥ Added to wishlist!', type: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="container section center-loading">Loading product details...</div>;
  if (!product) return (
    <div className="container section">
      <SEO title="Product Not Found" noindex={true} />
      <h2>Product not found</h2>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>The product you are looking for does not exist or has been removed.</p>
      <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
        Back to Shop
      </Link>
    </div>
  );

  const activeVariant = product.variants?.find(
    (v) => (v.size === selectedSize || !selectedSize) && (v.color === selectedColor || !selectedColor)
  );

  // Resolve variant image (or fallback to color-level image, or main product image)
  const variantImage = activeVariant?.image ||
    product.variants?.find((v) => v.color === selectedColor && v.image)?.image ||
    product.image;

  const displayPrice = activeVariant?.price_override
    ? Number(activeVariant.price_override)
    : product.on_sale
    ? Number(product.discount_price)
    : Number(product.price);

  const isAvailable = (product.stock > 0 || (product.variants || []).some(v => (v.stock || 0) > 0));

  // Collect all image URLs for Image and Schema.org SEO
  const allImages = Array.from(new Set([
    product.image,
    variantImage,
    ...(product.variants || []).map(v => v.image),
    ...(product.images || [])
  ])).filter(Boolean).map(img => img.startsWith('http') ? img : `${SITE_URL}${img.startsWith('/') ? '' : '/'}${img}`);

  const categoryName = product.categoryName || product.category_name || (typeof product.category === 'string' ? product.category : '');
  const categorySlug = product.categorySlug || (typeof product.category === 'string' ? product.category.toLowerCase().replace(/ /g, '-') : '');
  const subcategoryName = product.subcategoryName || product.subcategory_name || '';
  const subcategorySlug = product.subcategorySlug || '';

  // Construct structured breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', url: '/' },
    { label: 'Shop', url: '/shop' },
    ...(categoryName ? [{ label: categoryName, url: `/shop/${categorySlug}` }] : []),
    ...(subcategoryName ? [{ label: subcategoryName, url: `/shop/${categorySlug}/${subcategorySlug}` }] : []),
    { label: product.name },
  ];

  // Dynamic SEO description
  const cleanDescription = product.description
    ? product.description.replace(/<[^>]+>/g, '').trim().substring(0, 160)
    : `Shop ${product.name} online at Retrostylings. Discover stylish fashion apparel with supreme comfort and pan-India delivery.`;

  // Schema.org Structured Data
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/product/${product.slug || product.id}#product`,
    "name": product.name,
    "image": allImages.length > 0 ? allImages : [`${SITE_URL}/logo.png`],
    "description": cleanDescription,
    "sku": product.sku || `RS-${product.id}`,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Retrostylings"
    },
    ...(categoryName ? { "category": categoryName } : {}),
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/product/${product.slug || product.id}`,
      "priceCurrency": "INR",
      "price": displayPrice,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Retrostylings",
        "url": SITE_URL
      }
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      ...(item.url ? { "item": item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}` } : {})
    }))
  };

  const dynamicAlt = `${product.name}${selectedColor ? ` in ${selectedColor}` : ''} - Retrostylings Fashion`;

  return (
    <div className="product-details-page container section">
      <SEO
        title={product.name}
        description={cleanDescription}
        keywords={`${product.name}, ${categoryName || 'fashion'}, buy ${product.name} online, Retrostylings`}
        canonical={`/product/${product.slug || product.id}`}
        ogImage={variantImage || product.image}
        ogType="product"
        schema={[productSchema, breadcrumbSchema]}
      />

      {/* Visible Semantic Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      <div className="product-details-grid">
        {/* Gallery / Slideshow Photo View */}
        <div className="product-gallery" ref={galleryRef}>
          <div
            className="product-slideshow"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="main-image main-image--zoomable"
              onClick={openLightbox}
              title="Click to open full slideshow"
            >
              <img
                key={currentSlideImage}
                src={currentSlideImage}
                alt={`${dynamicAlt} - Photo ${activeImageIndex + 1}`}
                className="w-100 slideshow-main-img"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />

              {/* Slide Counter Badge */}
              {galleryImages.length > 1 && (
                <div className="slide-counter-badge">
                  <span>{activeImageIndex + 1} / {galleryImages.length}</span>
                </div>
              )}

              {/* Zoom Overlay */}
              <div className="zoom-overlay">
                <ZoomIn size={26} />
                <span>View Full Photo</span>
              </div>
            </div>

            {/* Navigation Arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="slide-nav-btn prev-btn"
                  onClick={prevSlide}
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  className="slide-nav-btn next-btn"
                  onClick={nextSlide}
                  aria-label="Next photo"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            {/* Pagination Dots */}
            {galleryImages.length > 1 && (
              <div className="slide-dots-container">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`slide-dot ${idx === activeImageIndex ? 'active' : ''}`}
                    onClick={(e) => selectSlide(idx, e)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="product-thumbnails-strip" aria-label="Photo thumbnails">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`thumbnail-item ${idx === activeImageIndex ? 'active' : ''}`}
                  onClick={(e) => selectSlide(idx, e)}
                  aria-label={`View photo ${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                  />
                  {idx === activeImageIndex && <span className="active-thumb-indicator" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-info">
          {categoryName && (
            <p className="product-category-label">
              <Link to={`/shop/${categorySlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {categoryName}
              </Link>
            </p>
          )}

          {/* Active Product Badges Bar */}
          {(() => {
            const matchedLabels = activeLabels.filter(
              (l) => (product.labelIds || []).includes(l.id) && l.status === 'active'
            );
            if (matchedLabels.length === 0) return null;
            return (
              <div className="details-labels-bar" style={{ display: 'flex', gap: '8px', margin: '0.25rem 0 0.75rem 0', flexWrap: 'wrap' }}>
                {matchedLabels.map((lbl) => (
                  <span
                    key={lbl.id}
                    style={{
                      backgroundColor: lbl.bgColor || '#8B5CF6',
                      color: lbl.textColor || '#FFFFFF',
                      padding: '5px 14px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {lbl.name}
                  </span>
                ))}
              </div>
            );
          })()}

          <h1 className="h2 product-name-heading">{product.name}</h1>

          <div className="product-price-section">
            {activeVariant?.price_override ? (
              <span className="current-price">₹{Number(activeVariant.price_override).toLocaleString()}</span>
            ) : product.on_sale ? (
              <>
                <span className="current-price">₹{Number(product.discount_price).toLocaleString()}</span>
                <span className="old-price">₹{Number(product.price).toLocaleString()}</span>
                <span className="sale-badge">SALE</span>
              </>
            ) : (
              <span className="current-price">₹{Number(product.price).toLocaleString()}</span>
            )}
          </div>

          <p className="product-description">{product.description}</p>

          {/* Stock Badge */}
          {product.stock === 0 ? (
            <span className="out-of-stock-badge">Out of Stock</span>
          ) : product.stock < 10 ? (
            <p className="low-stock-text">⚠ Only {product.stock} left!</p>
          ) : null}

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="product-variants">
              <div className="variant-group">
                <h3>Size</h3>
                <div className="variant-options">
                  {[...new Set(product.variants.map((v) => v.size))].map((size) => (
                    <button
                      key={size}
                      className={`variant-btn ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => handleSizeSelect(size)}
                      aria-label={`Select size ${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="variant-group">
                <h3>Color</h3>
                <div className="variant-options">
                  {[...new Set(product.variants.map((v) => v.color))].map((color) => (
                    <button
                      key={color}
                      className={`variant-btn ${selectedColor === color ? 'active' : ''}`}
                      onClick={() => handleColorSelect(color)}
                      aria-label={`Select color ${color}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Purchase / External Only Mode */}
          {product.enableOnlinePurchase !== false ? (
            <div className="purchase-section">
              <div className="quantity-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">+</button>
              </div>
              <button
                className="btn btn-primary add-to-cart-big"
                onClick={handleAddToCart}
                disabled={adding || product.stock === 0}
              >
                <ShoppingBag size={20} />
                {adding ? 'ADDING...' : product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
              </button>
              <button className="wishlist-btn-round" onClick={handleWishlist} aria-label="Add to Wishlist">
                <Heart size={20} />
              </button>
            </div>
          ) : (
            <div className="external-purchase-notice" style={{ margin: '1.25rem 0', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)', display: 'block' }}>Available via Partner Links / WhatsApp</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Direct website cart is disabled for this item. Click a partner link below to order.</span>
              </div>
              <button className="wishlist-btn-round" onClick={handleWishlist} title="Add to Wishlist" aria-label="Add to Wishlist">
                <Heart size={20} />
              </button>
            </div>
          )}

          {/* 🔹 Partner Marketplaces & See More Options */}
          {(product.amazonUrl || product.flipkartUrl || product.myntraUrl || product.meeshoUrl || product.whatsappUrl || product.seeMoreUrl) && (
            <div className="provider-links-container" style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-soft)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShoppingCart size={15} color="var(--primary)" /> Also Available On / Partner Stores
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {product.amazonUrl && (
                  <a href={product.amazonUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ background: '#FF9900', color: '#000', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    Buy on Amazon <ExternalLink size={13} />
                  </a>
                )}
                {product.flipkartUrl && (
                  <a href={product.flipkartUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ background: '#2874F0', color: '#FFF', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    Buy on Flipkart <ExternalLink size={13} />
                  </a>
                )}
                {product.myntraUrl && (
                  <a href={product.myntraUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ background: '#FF3F6C', color: '#FFF', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    Buy on Myntra <ExternalLink size={13} />
                  </a>
                )}
                {product.meeshoUrl && (
                  <a href={product.meeshoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ background: '#9C27B0', color: '#FFF', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    Buy on Meesho <ExternalLink size={13} />
                  </a>
                )}
                {product.whatsappUrl && (
                  <a href={product.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ background: '#25D366', color: '#000', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MessageSquare size={13} fill="#000" /> Order on WhatsApp <ExternalLink size={13} />
                  </a>
                )}
                {product.seeMoreUrl && (
                  <a href={product.seeMoreUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    {product.seeMoreText || 'See More Offers'} <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(255,215,0,0.04)', border: '1px dashed rgba(255,215,0,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--white)', display: 'block' }}>Loved this retro style?</span>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Share your review & earn +150 VIP reward points!</span>
            </div>
            <Link
              to={`/review?productId=${product.id}&product=${encodeURIComponent(product.name)}&image=${encodeURIComponent(product.image || '')}`}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--primary)', borderColor: 'rgba(255,215,0,0.4)', padding: '0.45rem 0.9rem' }}
            >
              <Star size={13} fill="currentColor" /> Write a Review
            </Link>
          </div>

          <div className="product-features-small">
            <div className="feature-small">
              <Truck size={24} />
              <div><h4>Free Shipping</h4><p>On orders above ₹999</p></div>
            </div>
            <div className="feature-small">
              <RotateCcw size={24} />
              <div><h4>Easy Returns</h4><p>7-day hassle-free return</p></div>
            </div>
            <div className="feature-small">
              <ShieldCheck size={24} />
              <div><h4>Secure Payment</h4><p>100% safe transactions</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Related Products Section (Internal Linking & Discovery) ── */}
      {relatedProducts.length > 0 && (
        <section className="related-products-section" style={{ marginTop: '4rem', paddingTop: '2.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>You May Also Like</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Explore more trending styles from {categoryName ? `our ${categoryName} collection` : 'our catalog'}.
              </p>
            </div>
            {categorySlug && (
              <Link to={`/shop/${categorySlug}`} className="btn btn-outline btn-sm" style={{ fontWeight: 600 }}>
                View All {categoryName} →
              </Link>
            )}
          </div>
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {relatedProducts.map((p) => (
              <ProductCard key={p.id || p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      <Toast isOpen={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

      {/* Slideshow Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Product image slideshow"
        >
          {/* Lightbox Header */}
          <div className="lightbox-header" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-info">
              <span className="lightbox-title">{product.name}</span>
              {galleryImages.length > 1 && (
                <span className="lightbox-count">
                  Photo {activeImageIndex + 1} of {galleryImages.length}
                </span>
              )}
            </div>
            <button
              type="button"
              className="lightbox-close"
              onClick={closeLightbox}
              aria-label="Close slideshow"
            >
              <X size={24} />
            </button>
          </div>

          {/* Lightbox Stage */}
          <div
            className="lightbox-stage"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {galleryImages.length > 1 && (
              <button
                type="button"
                className="lightbox-nav-btn prev-btn"
                onClick={prevSlide}
                aria-label="Previous slide"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            <div className="lightbox-content">
              <img
                key={currentSlideImage}
                src={currentSlideImage}
                alt={`${dynamicAlt} - Slideshow photo ${activeImageIndex + 1}`}
                className="lightbox-img"
              />
            </div>

            {galleryImages.length > 1 && (
              <button
                type="button"
                className="lightbox-nav-btn next-btn"
                onClick={nextSlide}
                aria-label="Next slide"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>

          {/* Lightbox Footer Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="lightbox-footer" onClick={(e) => e.stopPropagation()}>
              <div className="lightbox-thumbnails">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`lightbox-thumb ${idx === activeImageIndex ? 'active' : ''}`}
                    onClick={() => selectSlide(idx)}
                    aria-label={`View photo ${idx + 1}`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetails;

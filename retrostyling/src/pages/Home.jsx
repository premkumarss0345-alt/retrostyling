import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Star, Zap, Clock, ShoppingBag, Heart, Eye } from 'lucide-react';
import Hero from '../components/Hero';
import Service from '../components/Service';
import FashionFantasy from '../components/FashionFantasy';
import Newsletter from '../components/Newsletter';
import ProductCarousel from '../components/ProductCarousel';
import './Home.css';

/* ─── Flash Sale Countdown ────────────────────────────────── */
const FlashCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 5, m: 42, s: 18 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        return { h: 0, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="flash-countdown">
      {[{ label: 'HRS', val: timeLeft.h }, { label: 'MIN', val: timeLeft.m }, { label: 'SEC', val: timeLeft.s }].map((t, i) => (
        <React.Fragment key={t.label}>
          <div className="countdown-block">
            <span className="countdown-val">{pad(t.val)}</span>
            <span className="countdown-label">{t.label}</span>
          </div>
          {i < 2 && <span className="countdown-sep">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ─── Brand Logos ─────────────────────────────────────────── */
const BRANDS = [
  { name: 'Retrostylings', letter: 'R' },
  { name: 'UrbanEdge', letter: 'U' },
  { name: 'VintageVibes', letter: 'V' },
  { name: 'ModernStreet', letter: 'M' },
  { name: 'ClassicCo', letter: 'C' },
  { name: 'NeoFashion', letter: 'N' },
];

/* ─── Testimonials ────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Arjun Sharma', location: 'Mumbai', rating: 5, text: 'Absolutely love the quality! The leather jacket is exactly as shown — premium feel and perfect sizing. Will definitely shop again!', avatar: 'A', date: 'July 2026' },
  { name: 'Priya Nair', location: 'Bangalore', rating: 5, text: 'Fast delivery and great packaging. The floral dress is gorgeous and the fabric quality is outstanding. Retrostylings is now my go-to!', avatar: 'P', date: 'June 2026' },
  { name: 'Kiran Kumar', location: 'Chennai', rating: 4, text: 'Excellent collection and very easy website to navigate. Customer support helped me quickly when I had a sizing question. Highly recommend!', avatar: 'K', date: 'June 2026' },
  { name: 'Divya Menon', location: 'Delhi', rating: 5, text: "I've been shopping here for over a year. Consistent quality, great prices, and the loyalty points system is a nice bonus!", avatar: 'D', date: 'May 2026' },
];

/* ─── Flash Sale Products (Mock) ──────────────────────────── */
const FLASH_PRODUCTS = [
  { id: 1, name: 'Premium Leather Jacket', price: 4500, discountPrice: 2700, discount: 40, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', rating: 4.8, reviews: 124 },
  { id: 2, name: 'Retro Denim Jeans', price: 2200, discountPrice: 1540, discount: 30, image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', rating: 4.6, reviews: 89 },
  { id: 3, name: 'Vintage Sneakers', price: 3200, discountPrice: 1920, discount: 40, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', rating: 4.5, reviews: 67 },
  { id: 4, name: 'Summer Floral Dress', price: 1800, discountPrice: 1260, discount: 30, image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400', rating: 4.7, reviews: 95 },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const Home = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const nextTestimonial = () => setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
  const prevTestimonial = () => setCurrentTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <div className="home-page">
      {/* Hero */}
      <Hero />

      {/* Service Badges */}
      <Service />

      {/* New Arrivals */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeInUp}
      >
        <ProductCarousel title="New Drops" filter={{ isNew: true }} />
      </motion.div>

      {/* Flash Sale Section */}
      <section className="flash-sale-section">
        <div className="container">
          <motion.div
            className="flash-sale-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="flash-label">
              <Zap size={16} fill="currentColor" />
              Flash Sale
            </div>
            <div className="flash-sale-info">
              <h2>Deals End In</h2>
              <FlashCountdown />
            </div>
            <Link to="/shop?filter=sale" className="btn btn-outline btn-sm">
              View All Deals <ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div
            className="flash-products-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {FLASH_PRODUCTS.map(product => (
              <motion.div key={product.id} className="flash-product-card" variants={fadeInUp}>
                <div className="flash-product-image">
                  <img src={product.image} alt={product.name} className="img-cover" />
                  <div className="flash-discount-badge">-{product.discount}%</div>
                  <div className="flash-product-actions">
                    <button className={`flash-action-btn ${wishlist.includes(product.id) ? 'wishlisted' : ''}`} onClick={() => toggleWishlist(product.id)}>
                      <Heart size={16} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
                    </button>
                    <Link to={`/product/${product.name.toLowerCase().replace(/ /g, '-')}`} className="flash-action-btn">
                      <Eye size={16} />
                    </Link>
                  </div>
                </div>
                <div className="flash-product-info">
                  <h3>{product.name}</h3>
                  <div className="flash-product-rating">
                    <Star size={12} fill="#F59E0B" color="#F59E0B" />
                    <span>{product.rating}</span>
                    <span className="text-muted">({product.reviews})</span>
                  </div>
                  <div className="flash-product-price">
                    <span className="price-current">₹{product.discountPrice.toLocaleString()}</span>
                    <span className="price-original">₹{product.price.toLocaleString()}</span>
                  </div>
                  <button className="btn btn-primary btn-sm w-full">
                    <ShoppingBag size={14} /> Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Shop by Category */}
      <motion.div
        className="section-header-standalone"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="container">
          <div className="section-header">
            <div>
              <p className="section-label">Explore</p>
              <h2 className="section-title">Shop By Category</h2>
            </div>
            <Link to="/shop" className="btn btn-outline btn-sm">View All <ArrowRight size={14} /></Link>
          </div>
        </div>
      </motion.div>
      <FashionFantasy />

      {/* Trending */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeInUp}
      >
        <ProductCarousel title="Trending Now 🔥" filter={{ sort: 'popular' }} />
      </motion.div>

      {/* Promo Banner */}
      <motion.section
        className="promo-banner"
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="container">
          <div className="promo-content">
            <motion.span className="promo-label-tag" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              LIMITED TIME OFFER
            </motion.span>
            <motion.h2 className="promo-title" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              Summer Collection <br />
              <span className="promo-highlight">Up to 40% OFF</span>
            </motion.h2>
            <motion.p className="promo-desc" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              Use code <strong>SUMMER40</strong> at checkout. Limited stock available.
            </motion.p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/shop" className="btn btn-primary btn-lg">
                Shop Now <ArrowRight size={20} />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Best Sellers */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeInUp}
      >
        <ProductCarousel title="Best Sellers" />
      </motion.div>

      {/* Brand Showcase */}
      <section className="brands-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div>
              <p className="section-label">Partners</p>
              <h2 className="section-title">Our Brands</h2>
            </div>
          </motion.div>
          <motion.div
            className="brands-row"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {BRANDS.map(brand => (
              <motion.div key={brand.name} className="brand-chip" variants={fadeInUp} whileHover={{ y: -4, scale: 1.05 }}>
                <div className="brand-chip-icon">{brand.letter}</div>
                <span>{brand.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div>
              <p className="section-label">Reviews</p>
              <h2 className="section-title">What Customers Say</h2>
            </div>
            <div className="testimonial-nav">
              <button className="btn btn-ghost btn-icon" onClick={prevTestimonial}><ChevronLeft size={20} /></button>
              <button className="btn btn-ghost btn-icon" onClick={nextTestimonial}><ChevronRight size={20} /></button>
            </div>
          </motion.div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                className={`testimonial-card ${i === currentTestimonial ? 'featured' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="testimonial-stars">
                  {[...Array(t.rating)].map((_, si) => (
                    <Star key={si} size={13} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.location} · {t.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <Newsletter />
    </div>
  );
};

export default Home;

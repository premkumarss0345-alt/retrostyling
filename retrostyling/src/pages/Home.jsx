import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import Service from '../components/Service';
import FashionFantasy from '../components/FashionFantasy';
import Newsletter from '../components/Newsletter';
import ProductCarousel from '../components/ProductCarousel';
import { ArrowRight } from 'lucide-react';
import './Home.css';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const Home = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="home-page">
      <Hero />
      <Service />

      {/* New Arrivals */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeInUp}>
        <ProductCarousel title="New Drops" filter={{ isNew: true }} />
      </motion.div>

      {/* Shop by Category */}
      <motion.div className="section-title-container" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
        <h2 className="section-title">Shop By Category</h2>
        <p className="section-subtitle">Curated styles for every occasion</p>
      </motion.div>
      <FashionFantasy />

      {/* Promo Banner */}
      <section className="promo-banner section">
        <div className="promo-content">
          <motion.span className="promo-label" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            LIMITED TIME OFFER
          </motion.span>
          <motion.h2 className="promo-title" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            Summer Collection <br /> Up to 40% OFF
          </motion.h2>
          <motion.a href="/shop" className="btn btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Shop Now <ArrowRight size={20} />
          </motion.a>
        </div>
      </section>

      {/* Trending */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
        <ProductCarousel title="Trending Now" filter={{ sort: 'popular' }} />
      </motion.div>

      <Newsletter />
    </div>
  );
};

export default Home;

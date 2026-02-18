import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import Service from '../components/Service';
import FashionFantasy from '../components/FashionFantasy';
import Newsletter from '../components/Newsletter';
import ProductCarousel from '../components/ProductCarousel';
import { ArrowRight } from 'lucide-react';
import './Home.css';

// Animation Variants
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const Home = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="home-page">
            {/* 1. Hero Section */}
            <Hero />

            {/* 2. Service/Benefits - Lifted up to be immediately visible */}
            <Service />

            {/* 3. New Arrivals Carousel */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
            >
                <ProductCarousel title="New Drops" fetchUrl="/api/products?is_new=1" />
            </motion.div>

            {/* 4. Featured Categories (FashionFantasy) */}
            <motion.div
                className="section-title-container"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
            >
                <h2 className="section-title">Shop By Category</h2>
                <p className="section-subtitle">Curated styles for every occasion</p>
            </motion.div>
            <FashionFantasy />

            {/* 5. Promotional Full-Width Banner */}
            <section className="promo-banner section">
                <div className="promo-content">
                    <motion.span
                        className="promo-label"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        LIMITED TIME OFFER
                    </motion.span>
                    <motion.h2
                        className="promo-title"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Summer Collection <br /> Up to 40% OFF
                    </motion.h2>
                    <motion.a
                        href="/shop"
                        className="btn btn-white"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Shop Now <ArrowRight size={20} />
                    </motion.a>
                </div>
            </section>

            {/* 6. Trending / Best Sellers */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
            >
                <ProductCarousel title="Trending Now" fetchUrl="/api/products?sort=popular" />
            </motion.div>

            {/* 7. Newsletter */}
            <Newsletter />
        </div>
    );
};

export default Home;

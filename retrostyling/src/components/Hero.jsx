import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './Hero.css';

const Hero = () => {
    const [slides, setSlides] = useState([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/hero-slides');
            const data = await res.json();
            if (data.length > 0) {
                setSlides(data);
            } else {
                // Fallback dummy
                setSlides([{
                    id: 0,
                    image: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=2070',
                    title: 'Welcome to Retrostylings',
                    subtitle: 'ELEVATE YOUR STYLE',
                    description: 'Modern fashion for the contemporary soul.'
                }]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent(prev => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 6000);
        return () => clearInterval(timer);
    }, [slides]);

    const nextSlide = () => setCurrent(prev => (prev === slides.length - 1 ? 0 : prev + 1));
    const prevSlide = () => setCurrent(prev => (prev === 0 ? slides.length - 1 : prev - 1));

    if (loading || slides.length === 0) return null;

    const currentSlide = slides[current];
    const imageSrc = currentSlide.image.startsWith('/')
        ? `http://localhost:5001${currentSlide.image}` // Local upload
        : currentSlide.image; // External URL

    return (
        <section className="hero">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    className="hero-background"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${imageSrc})` }}
                />
            </AnimatePresence>

            <div className="container hero-container">
                <div className="hero-content">
                    <AnimatePresence mode="wait">
                        <motion.div key={current}>
                            {currentSlide.subtitle && (
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: 0.2 }}
                                    className="hero-subtitle"
                                >
                                    {currentSlide.subtitle}
                                </motion.p>
                            )}
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ delay: 0.3 }}
                                className="hero-title h1"
                            >
                                {currentSlide.title ? currentSlide.title.split('\\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line} <br />
                                    </React.Fragment>
                                )) : 'Welcome'}
                            </motion.h1>
                            {currentSlide.description && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="hero-description"
                                >
                                    {currentSlide.description.split('\\n').map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line} <br className="desktop-only" />
                                        </React.Fragment>
                                    ))}
                                </motion.p>
                            )}
                            <motion.a
                                href="/shop"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="btn btn-hero"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                                Shop Collection <ChevronRight size={20} />
                            </motion.a>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {slides.length > 1 && (
                    <div className="hero-controls">
                        <button onClick={prevSlide} className="control-btn prev">
                            <ChevronLeft size={24} />
                        </button>
                        <div className="dots">
                            {slides.map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`dot ${idx === current ? 'active' : ''}`}
                                    onClick={() => setCurrent(idx)}
                                />
                            ))}
                        </div>
                        <button onClick={nextSlide} className="control-btn next">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                )}
            </div>

            <div className="hero-scroll-indicator">
                <div className="mouse"></div>
                <span>Scroll Down</span>
            </div>
        </section>
    );
};

export default Hero;

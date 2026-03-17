import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { heroService } from '../services/firestoreService';
import './Hero.css';

const FALLBACK = [{
  id: 'fallback',
  image: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=2070',
  title: 'Welcome to Retrostylings',
  subtitle: 'ELEVATE YOUR STYLE',
  description: 'Modern fashion for the contemporary soul.',
}];

const Hero = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSlides(); }, []);

  const loadSlides = async () => {
    try {
      const data = await heroService.getActive();
      setSlides(data.length > 0 ? data : FALLBACK);
    } catch (err) {
      console.error(err);
      setSlides(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(
      () => setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1)),
      6000
    );
    return () => clearInterval(timer);
  }, [slides]);

  const nextSlide = () => setCurrent((p) => (p === slides.length - 1 ? 0 : p + 1));
  const prevSlide = () => setCurrent((p) => (p === 0 ? slides.length - 1 : p - 1));

  if (loading || slides.length === 0) return null;

  const s = slides[current];
  const imgSrc = s.image?.startsWith('/') ? s.image : s.image;

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
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${imgSrc})`,
          }}
        />
      </AnimatePresence>

      <div className="container hero-container">
        <div className="hero-content">
          <AnimatePresence mode="wait">
            <motion.div key={current}>
              {s.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }} transition={{ delay: 0.2 }}
                  className="hero-subtitle"
                >
                  {s.subtitle}
                </motion.p>
              )}
              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }} transition={{ delay: 0.3 }}
                className="hero-title h1"
              >
                {s.title || 'Welcome'}
              </motion.h1>
              {s.description && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }} transition={{ delay: 0.4 }}
                  className="hero-description"
                >
                  {s.description}
                </motion.p>
              )}
              <motion.a
                href="/shop"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
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
            <button onClick={prevSlide} className="control-btn prev"><ChevronLeft size={24} /></button>
            <div className="dots">
              {slides.map((_, idx) => (
                <span
                  key={idx}
                  className={`dot ${idx === current ? 'active' : ''}`}
                  onClick={() => setCurrent(idx)}
                />
              ))}
            </div>
            <button onClick={nextSlide} className="control-btn next"><ChevronRight size={24} /></button>
          </div>
        )}
      </div>

      <div className="hero-scroll-indicator">
        <div className="mouse" />
        <span>Scroll Down</span>
      </div>
    </section>
  );
};

export default Hero;

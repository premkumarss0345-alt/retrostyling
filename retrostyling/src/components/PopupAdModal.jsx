import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { popupAdService } from '../services/firestoreService';

const PopupAdModal = () => {
  const [activeAd, setActiveAd] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only show on customer frontend routes (not admin)
    if (location.pathname.startsWith('/admin')) return;

    let timerId = null;

    popupAdService.getActive().then(ads => {
      if (!ads || ads.length === 0) return;

      const isMobile = window.innerWidth < 768;
      const currentPath = location.pathname;

      // Find first ad that satisfies rules
      const eligible = ads.find(ad => {
        // Device check
        if (isMobile && ad.enabledMobile === false) return false;
        if (!isMobile && ad.enabledDesktop === false) return false;

        // Target page check
        if (ad.targetPages && ad.targetPages.length > 0) {
          const match = ad.targetPages.some(p => p === currentPath || (p !== '/' && currentPath.startsWith(p)));
          if (!match) return false;
        }

        // Date check
        const now = new Date();
        const start = ad.startDate ? new Date(ad.startDate.seconds ? ad.startDate.seconds * 1000 : ad.startDate) : null;
        const end = ad.endDate ? new Date(ad.endDate.seconds ? ad.endDate.seconds * 1000 : ad.endDate) : null;
        if (start && now < start) return false;
        if (end && now > end) return false;

        // Frequency check
        const freqKey = `popup_ad_closed_${ad.id}`;
        if (ad.displayFrequency === 'once_per_session') {
          if (sessionStorage.getItem(freqKey)) return false;
        } else if (ad.displayFrequency === 'once_per_day') {
          const lastClosed = localStorage.getItem(freqKey);
          if (lastClosed) {
            const hoursPassed = (Date.now() - Number(lastClosed)) / (1000 * 60 * 60);
            if (hoursPassed < 24) return false;
          }
        }

        return true;
      });

      if (eligible) {
        setActiveAd(eligible);
        const delayMs = (eligible.displayDelay || 0) * 1000;
        timerId = setTimeout(() => {
          setIsOpen(true);
        }, delayMs);
      }
    }).catch(console.error);

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [location.pathname]);

  const handleClose = () => {
    if (!activeAd) return;
    setIsOpen(false);
    const freqKey = `popup_ad_closed_${activeAd.id}`;
    if (activeAd.displayFrequency === 'once_per_session') {
      sessionStorage.setItem(freqKey, 'true');
    } else if (activeAd.displayFrequency === 'once_per_day') {
      localStorage.setItem(freqKey, String(Date.now()));
    }
  };

  if (!isOpen || !activeAd) return null;

  return (
    <AnimatePresence>
      <div
        className="modal-backdrop"
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.85, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 25 }}
          style={{
            maxWidth: 460,
            width: '100%',
            background: 'var(--bg-card)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.9)',
            border: '1px solid var(--border-bright)',
            position: 'relative'
          }}
        >
          <button
            onClick={handleClose}
            aria-label="Close Announcement"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 10,
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.65)',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}
          >
            <X size={18} />
          </button>

          {activeAd.image && (
            <img
              src={activeAd.image}
              alt={activeAd.title || activeAd.name}
              style={{ width: '100%', height: '220px', objectFit: 'cover' }}
            />
          )}

          <div style={{ padding: '1.75rem', textAlign: 'center' }}>
            {activeAd.title && (
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>
                {activeAd.title}
              </h3>
            )}
            {activeAd.description && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.55', marginBottom: '1.5rem' }}>
                {activeAd.description}
              </p>
            )}

            {activeAd.buttonText && (
              <a
                href={activeAd.buttonUrl || '/shop'}
                onClick={() => handleClose()}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.85rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  fontSize: '0.95rem'
                }}
              >
                {activeAd.buttonText} <ExternalLink size={16} />
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PopupAdModal;

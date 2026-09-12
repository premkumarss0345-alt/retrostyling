import React, { useEffect, useState } from 'react';
import logoImg from '../assets/logo.png';
import './SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
  const [phase, setPhase] = useState('enter'); // enter | hold | exit

  useEffect(() => {
    // Phase 1: logo animates in (600ms)
    // Phase 2: hold (800ms)
    // Phase 3: exit fade-out (500ms)
    const holdTimer = setTimeout(() => setPhase('exit'), 1400);
    const doneTimer = setTimeout(() => onFinish(), 1900);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-root ${phase}`} aria-hidden="true">
      {/* Background glow orbs */}
      <div className="splash-orb splash-orb-1" />
      <div className="splash-orb splash-orb-2" />

      <div className="splash-content">
        {/* Logo mark */}
        <div className="splash-logo-wrap">
          <img
            src={logoImg}
            alt="Retro Stylings"
            className="splash-logo-img"
            style={{
              width: '90px',
              height: '90px',
              display: 'block',
              objectFit: 'contain',
              background: '#ffffff',
              padding: '10px',
              boxSizing: 'border-box',
              borderRadius: '22px',
            }}
          />
          <div className="splash-logo-ring" />
        </div>

        {/* Brand name */}
        <div className="splash-brand">
          <span className="splash-brand-retro">RETRO</span>
          <span className="splash-brand-stylings">STYLINGS</span>
        </div>

        {/* Tagline */}
        <p className="splash-tagline">Streetwear Culture • Premium Fashion</p>

        {/* Loading bar */}
        <div className="splash-bar-track">
          <div className="splash-bar-fill" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

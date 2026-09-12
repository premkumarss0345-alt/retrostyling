import React, { useEffect, useState } from 'react';
import logoImg from '../assets/logo.png';
import './SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
  const [phase, setPhase] = useState('enter'); // enter | hold | exit

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('exit'), 3000);
    const doneTimer = setTimeout(() => onFinish(), 3500);
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
            onError={(event) => {
              event.currentTarget.src = '/logo.png';
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

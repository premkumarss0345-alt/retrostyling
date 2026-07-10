import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Truck, Zap, MapPin, Clock, Package, CheckCircle, Star,
  ArrowRight, ShieldCheck, Phone, Globe
} from 'lucide-react';
import { shippingSettingsService } from '../services/firestoreService';
import './ShippingInfo.css';

const ShippingInfo = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shippingSettingsService.get().then(s => {
      setSettings(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="si-loading">
        <div className="si-spinner" />
        <p>Loading shipping information...</p>
      </div>
    );
  }

  const s = settings || {};
  const {
    freeShippingLimit = 999,
    standardCharge = 99,
    expressCharge = 199,
    minDeliveryDays = 3,
    maxDeliveryDays = 7,
    expressDeliveryDays = 1,
    courierPartners = ['BlueDart', 'Delhivery', 'Shiprocket'],
    deliveryZones = ['Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pan India'],
    sameDayAvailable = false,
    expressAvailable = true,
    returnWindowDays = 7,
  } = s;

  const deliveryOptions = [
    {
      icon: Truck,
      label: 'Standard Delivery',
      time: `${minDeliveryDays}–${maxDeliveryDays} Business Days`,
      charge: standardCharge === 0 ? 'FREE' : `₹${standardCharge}`,
      free: `FREE above ₹${freeShippingLimit.toLocaleString()}`,
      color: '#DFFF1B',
      available: true,
    },
    {
      icon: Zap,
      label: 'Express Delivery',
      time: `${expressDeliveryDays} Business Day`,
      charge: `₹${expressCharge}`,
      free: 'Available on select cities',
      color: '#8B5CF6',
      available: expressAvailable,
    },
    {
      icon: Star,
      label: 'Same Day Delivery',
      time: 'By 10 PM (order before 12 PM)',
      charge: 'City-specific pricing',
      free: 'Selected metros only',
      color: '#00F5FF',
      available: sameDayAvailable,
    },
  ];

  return (
    <div className="si-page">
      {/* Hero */}
      <div className="si-hero">
        <div className="si-hero-glow" />
        <motion.div
          className="si-hero-content container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="si-hero-icon"><Truck size={32} /></div>
          <h1 className="si-hero-title">Shipping & Delivery</h1>
          <p className="si-hero-subtitle">
            Fast, reliable delivery across India. Free shipping on orders above ₹{freeShippingLimit.toLocaleString()}.
          </p>
        </motion.div>
      </div>

      <div className="si-body container">
        {/* Delivery Options */}
        <motion.section
          className="si-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="si-section-title">Delivery Options</h2>
          <div className="si-delivery-grid">
            {deliveryOptions.map((opt, i) => {
              const Icon = opt.icon;
              return (
                <motion.div
                  key={i}
                  className={`si-delivery-card ${!opt.available ? 'si-delivery-card--unavailable' : ''}`}
                  style={{ '--dcard-color': opt.color }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  whileHover={opt.available ? { y: -4 } : {}}
                >
                  <div className="si-dcard-header">
                    <div className="si-dcard-icon"><Icon size={22} /></div>
                    <div>
                      <h3>{opt.label}</h3>
                      {!opt.available && <span className="si-coming-soon">Coming Soon</span>}
                    </div>
                  </div>
                  <div className="si-dcard-time">
                    <Clock size={14} />
                    <span>{opt.time}</span>
                  </div>
                  <div className="si-dcard-charge">
                    <span className="si-charge-amount">{opt.charge}</span>
                    <span className="si-charge-note">{opt.free}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Free Shipping Banner */}
        <motion.div
          className="si-free-banner"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="si-free-icon"><ShieldCheck size={28} /></div>
          <div>
            <h3>Free Standard Shipping</h3>
            <p>On all orders above <strong>₹{freeShippingLimit.toLocaleString()}</strong> — no coupon needed.</p>
          </div>
          <Link to="/shop" className="btn btn-primary si-free-cta">
            Shop Now <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Delivery Zones */}
        <motion.section
          className="si-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="si-section-title"><MapPin size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />Delivery Locations</h2>
          <p className="si-section-subtitle">We deliver across India. Express and same-day options available in select cities.</p>
          <div className="si-zones-grid">
            {deliveryZones.map((zone, i) => (
              <motion.div
                key={i}
                className="si-zone-chip"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <MapPin size={13} />
                <span>{zone}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Courier Partners */}
        <motion.section
          className="si-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="si-section-title"><Globe size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />Courier Partners</h2>
          <p className="si-section-subtitle">We partner with India's most reliable logistics companies for secure and timely delivery.</p>
          <div className="si-couriers-grid">
            {courierPartners.map((cp, i) => (
              <div key={i} className="si-courier-chip">
                <Package size={18} />
                <span>{cp}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Shipping Timeline */}
        <motion.section
          className="si-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="si-section-title">Order Timeline</h2>
          <div className="si-order-timeline">
            {[
              { icon: CheckCircle, label: 'Order Confirmed', desc: 'Within minutes of placing order' },
              { icon: Package, label: 'Packed', desc: 'Same / next business day' },
              { icon: Truck, label: 'Shipped', desc: `Day 1–2` },
              { icon: MapPin, label: 'Out for Delivery', desc: `Day ${minDeliveryDays}–${maxDeliveryDays}` },
              { icon: Star, label: 'Delivered', desc: 'Your order arrives!' },
            ].map((step, i, arr) => {
              const Icon = step.icon;
              return (
                <div key={i} className="si-ot-step">
                  <div className="si-ot-left">
                    <div className="si-ot-icon"><Icon size={18} /></div>
                    {i < arr.length - 1 && <div className="si-ot-line" />}
                  </div>
                  <div className="si-ot-right">
                    <h4>{step.label}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Info Cards */}
        <motion.section
          className="si-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="si-info-grid">
            <div className="si-info-card">
              <RotateCcw size={20} />
              <h4>Easy Returns</h4>
              <p>{returnWindowDays}-day return window. <Link to="/return-policy">View return policy →</Link></p>
            </div>
            <div className="si-info-card">
              <Phone size={20} />
              <h4>Live Tracking</h4>
              <p>Track your order anytime at <Link to="/track-order">track-order</Link> or via SMS.</p>
            </div>
            <div className="si-info-card">
              <ShieldCheck size={20} />
              <h4>Safe Packaging</h4>
              <p>Every item is carefully packed to ensure it reaches you in perfect condition.</p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

// Need this import at the top since it's used in the info cards section
const RotateCcw = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
);

export default ShippingInfo;

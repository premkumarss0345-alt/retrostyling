import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  RotateCcw, CheckCircle, XCircle, Clock, CreditCard, RefreshCw,
  ChevronDown, Package, AlertTriangle, Banknote, ShieldCheck, ArrowRight
} from 'lucide-react';
import './ReturnPolicy.css';

const RETURN_CONDITIONS = [
  'Item must be unused, unwashed and in original condition',
  'Original tags and packaging must be intact',
  'Return request must be raised within 7 days of delivery',
  'Item must not have been altered or customized',
  'Proof of purchase (order ID) must be provided',
];

const NON_RETURNABLE = [
  'Innerwear, lingerie, and swimwear (for hygiene reasons)',
  'Customised / personalised items',
  'Items marked as "Final Sale" or "Non-Returnable"',
  'Items damaged due to improper use or washing',
  'Free gifts included with an order',
];

const REFUND_METHODS = [
  { icon: CreditCard, label: 'Original Payment Method', desc: 'Refunded within 5–7 business days after return is received.', color: '#8B5CF6' },
  { icon: Banknote, label: 'Store Credits', desc: 'Instant credit to your Retrostylings wallet. Use on next order.', color: '#DFFF1B' },
  { icon: RefreshCw, label: 'Exchange', desc: 'Exchange for a different size or color — no extra charges.', color: '#00F5FF' },
];

const FAQS = [
  {
    q: 'How do I initiate a return?',
    a: 'Go to My Account → Orders, find the delivered order, and click "Request Return". Fill in the reason and submit — our team will review within 24 hours.',
  },
  {
    q: 'How long does the refund take?',
    a: 'After we receive and inspect the returned item (1–2 days), refunds to the original payment method take 5–7 business days. Store credits are instant.',
  },
  {
    q: 'Who pays for return shipping?',
    a: 'We arrange a free pickup for all approved returns within serviceable areas. No shipping charges apply.',
  },
  {
    q: 'Can I exchange for a different product?',
    a: 'Currently, exchanges are supported only for different sizes or colors of the same product. For a completely different product, please return and place a new order.',
  },
  {
    q: 'What if I received a damaged or wrong item?',
    a: 'Contact us within 48 hours of delivery with photos. We will arrange an immediate replacement or full refund at no cost to you.',
  },
  {
    q: 'Can I return part of my order?',
    a: 'Yes! You can request a return for individual items within a multi-item order as long as they meet the return conditions.',
  },
];

const RETURN_STEPS = [
  { step: 1, title: 'Submit Request', desc: 'In My Account → Orders within 7 days of delivery' },
  { step: 2, title: 'Under Review', desc: 'Our team reviews within 24 business hours' },
  { step: 3, title: 'Pickup Scheduled', desc: 'Courier picks up from your address' },
  { step: 4, title: 'Quality Check', desc: 'Item inspected at our warehouse (1–2 days)' },
  { step: 5, title: 'Refund Processed', desc: '5–7 days to original payment / instant store credit' },
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rp-faq-item ${open ? 'open' : ''}`}>
      <button className="rp-faq-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="rp-faq-a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReturnPolicy = () => {
  return (
    <div className="rp-page">
      {/* Hero */}
      <div className="rp-hero">
        <div className="rp-hero-glow" />
        <motion.div
          className="rp-hero-content container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="rp-hero-icon">
            <RotateCcw size={32} />
          </div>
          <h1 className="rp-hero-title">Return & Refund Policy</h1>
          <p className="rp-hero-subtitle">
            Hassle-free returns within 7 days. We stand by every piece we sell.
          </p>
          <div className="rp-hero-badges">
            <span className="rp-badge"><CheckCircle size={14} /> 7-Day Returns</span>
            <span className="rp-badge"><ShieldCheck size={14} /> Free Pickup</span>
            <span className="rp-badge"><Clock size={14} /> Fast Refunds</span>
          </div>
        </motion.div>
      </div>

      <div className="rp-body container">
        {/* Quick Summary Cards */}
        <motion.div
          className="rp-cards-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="rp-card rp-card--primary">
            <Clock size={28} />
            <h3>7 Days</h3>
            <p>Return window from delivery date</p>
          </div>
          <div className="rp-card">
            <Package size={28} />
            <h3>Free Pickup</h3>
            <p>We arrange return courier at no cost</p>
          </div>
          <div className="rp-card">
            <CreditCard size={28} />
            <h3>5–7 Days</h3>
            <p>Refund to original payment method</p>
          </div>
          <div className="rp-card rp-card--accent">
            <RefreshCw size={28} />
            <h3>Easy Exchange</h3>
            <p>Size or color swap with no hassle</p>
          </div>
        </motion.div>

        {/* Return Eligibility */}
        <motion.section
          className="rp-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="rp-section-header">
            <CheckCircle size={22} className="rp-section-icon success" />
            <h2>Return Conditions</h2>
          </div>
          <div className="rp-conditions-list">
            {RETURN_CONDITIONS.map((c, i) => (
              <motion.div
                key={i}
                className="rp-condition-item rp-condition--ok"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <CheckCircle size={16} className="rp-cond-icon" />
                <span>{c}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Non-Returnable */}
        <motion.section
          className="rp-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="rp-section-header">
            <XCircle size={22} className="rp-section-icon danger" />
            <h2>Non-Returnable Items</h2>
          </div>
          <div className="rp-nr-callout">
            <AlertTriangle size={18} />
            <span>The following items cannot be returned or exchanged for hygiene and quality reasons.</span>
          </div>
          <div className="rp-conditions-list">
            {NON_RETURNABLE.map((c, i) => (
              <motion.div
                key={i}
                className="rp-condition-item rp-condition--no"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <XCircle size={16} className="rp-cond-icon" />
                <span>{c}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Process Timeline */}
        <motion.section
          className="rp-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="rp-section-header">
            <Clock size={22} className="rp-section-icon" />
            <h2>Return Process</h2>
          </div>
          <div className="rp-timeline">
            {RETURN_STEPS.map((s, i) => (
              <div key={i} className="rp-timeline-step">
                <div className="rp-timeline-left">
                  <div className="rp-step-num">{s.step}</div>
                  {i < RETURN_STEPS.length - 1 && <div className="rp-step-line" />}
                </div>
                <div className="rp-timeline-right">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Refund Methods */}
        <motion.section
          className="rp-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="rp-section-header">
            <CreditCard size={22} className="rp-section-icon" />
            <h2>Refund Methods</h2>
          </div>
          <div className="rp-refund-grid">
            {REFUND_METHODS.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={i}
                  className="rp-refund-card"
                  style={{ '--accent-color': m.color }}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="rp-refund-icon">
                    <Icon size={24} />
                  </div>
                  <h4>{m.label}</h4>
                  <p>{m.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Exchange Policy */}
        <motion.section
          className="rp-section rp-exchange-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="rp-section-header">
            <RefreshCw size={22} className="rp-section-icon" />
            <h2>Exchange Policy</h2>
          </div>
          <div className="rp-exchange-content">
            <div className="rp-exchange-points">
              <div className="rp-ep"><CheckCircle size={16} /><span>Exchange for a different size within 7 days</span></div>
              <div className="rp-ep"><CheckCircle size={16} /><span>Exchange for a different color of the same style</span></div>
              <div className="rp-ep"><CheckCircle size={16} /><span>No extra charges for approved exchanges</span></div>
              <div className="rp-ep"><XCircle size={16} className="danger" /><span>Cross-product exchanges are not supported (return + reorder)</span></div>
            </div>
          </div>
        </motion.section>

        {/* FAQs */}
        <motion.section
          className="rp-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="rp-section-header">
            <ChevronDown size={22} className="rp-section-icon" />
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="rp-faqs">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} {...faq} />
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          className="rp-cta-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3>Want to initiate a return?</h3>
          <p>Go to your order history and click "Request Return" on any eligible delivered order.</p>
          <div className="rp-cta-btns">
            <Link to="/profile" className="btn btn-primary">
              My Orders <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="btn btn-outline">
              Contact Support
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReturnPolicy;

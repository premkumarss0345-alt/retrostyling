import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CreditCard, ShieldCheck, Lock, Smartphone, Building2, HelpCircle,
  ChevronDown, ArrowRight, ShieldAlert, BadgePercent, Coins
} from 'lucide-react';
import './PaymentType.css';

const PAYMENT_METHODS = [
  {
    icon: CreditCard,
    title: 'Credit / Debit Cards',
    desc: 'We accept Visa, Mastercard, RuPay, and American Express. Zero payment gateway charges apply.',
    color: '#00F5FF',
    badge: 'Popular'
  },
  {
    icon: Smartphone,
    title: 'UPI (Instant)',
    desc: 'Pay directly from your bank account using Google Pay, PhonePe, Paytm, or BHIM UPI.',
    color: '#DFFF1B',
    badge: 'Recommended'
  },
  {
    icon: Coins,
    title: 'Cash on Delivery (COD)',
    desc: 'Pay in cash or digital scan upon delivery. COD is available on order values up to ₹9,999.',
    color: '#8B5CF6'
  },
  {
    icon: Building2,
    title: 'Net Banking',
    desc: 'Support for all major Indian banks including HDFC, ICICI, SBI, Axis Bank, and Kotak.',
    color: '#FF6B6B'
  },
  {
    icon: BadgePercent,
    title: 'EMI & Pay Later',
    desc: 'Easy monthly installments & deferred payment options through Simpl and LazyPay.',
    color: '#10B981'
  }
];

const SECURITY_FEATURES = [
  {
    icon: Lock,
    title: 'PCI-DSS Compliant',
    desc: 'Our payment processor is PCI-DSS Level 1 certified, ensuring highest level of security for card data.'
  },
  {
    icon: ShieldCheck,
    title: 'SSL Encryption',
    desc: 'All transactions are encrypted with 256-bit Secure Socket Layer (SSL) technology.'
  },
  {
    icon: ShieldAlert,
    title: 'Fraud Prevention',
    desc: 'Real-time risk evaluation and 3D Secure verification (OTP) to prevent unauthorized usage.'
  }
];

const PAYMENT_FAQS = [
  {
    q: 'Is it safe to use my credit/debit card on Retrostylings?',
    a: 'Absolutely. We do not store any card details on our servers. All transactions are securely processed through industry-leading payment gateways (like Razorpay) with 256-bit encryption and 3D-secure authentication (OTP).'
  },
  {
    q: 'Are there any extra charges for Cash on Delivery (COD)?',
    a: 'We charge a nominal handling fee of ₹49 for COD orders to cover additional courier processing costs. Prepaid orders enjoy free shipping.'
  },
  {
    q: 'Why did my transaction fail?',
    a: 'Transaction failures can occur due to bank network congestion, incorrect details (CVV/OTP), or insufficient funds. In case your account is debited but the order is not placed, the amount will be automatically refunded by your bank within 3–5 business days.'
  },
  {
    q: 'Can I pay using international cards?',
    a: 'Yes, we accept major international credit and debit cards. Note that foreign currency conversion rates and transaction fees may apply depending on your card issuer.'
  },
  {
    q: 'How do refunds work for canceled orders?',
    a: 'Refunds are processed back to the original payment source. Once initiated, UPI refunds take 1–2 days, card refunds take 5–7 business days, and net banking takes 3–5 business days.'
  }
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`pt-faq-item ${open ? 'open' : ''}`}>
      <button className="pt-faq-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="pt-faq-a"
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

const PaymentType = () => {
  return (
    <div className="pt-page">
      {/* Hero */}
      <div className="pt-hero">
        <div className="pt-hero-glow" />
        <motion.div
          className="pt-hero-content container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="pt-hero-icon"><ShieldCheck size={32} /></div>
          <h1 className="pt-hero-title">Payment Methods</h1>
          <p className="pt-hero-subtitle">Fast, secure, and flexible payment options tailored for your convenience.</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="pt-body container">
        {/* Methods Grid */}
        <section className="pt-section">
          <div className="pt-section-header">
            <h2>Accepted Payment Options</h2>
            <p>Choose from our wide range of safe transaction methods.</p>
          </div>
          <div className="pt-methods-grid">
            {PAYMENT_METHODS.map((method, idx) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={method.title}
                  className="pt-method-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="pt-card-top">
                    <div className="pt-card-icon" style={{ background: `${method.color}15`, color: method.color }}>
                      <Icon size={24} />
                    </div>
                    {method.badge && (
                      <span className="pt-card-badge" style={{ backgroundColor: method.color, color: '#000' }}>
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <h3>{method.title}</h3>
                  <p>{method.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Security Section */}
        <section className="pt-section pt-security-section">
          <div className="pt-security-card">
            <div className="pt-security-glow" />
            <div className="pt-security-grid">
              <div className="pt-security-info">
                <h2>100% Secure Checkout</h2>
                <p>Your security is our absolute priority. We partner with India's leading payment gateways to offer a seamless, secure, and hassle-free checkout experience.</p>
                <div className="pt-security-badges">
                  <div className="pt-badge-item">
                    <Lock size={16} /> 256-Bit SSL Encryption
                  </div>
                  <div className="pt-badge-item">
                    <ShieldCheck size={16} /> PCI-DSS Certified
                  </div>
                </div>
              </div>
              <div className="pt-security-features">
                {SECURITY_FEATURES.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <div key={feat.title} className="pt-feat-item">
                      <div className="pt-feat-icon"><Icon size={20} /></div>
                      <div>
                        <h4>{feat.title}</h4>
                        <p>{feat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="pt-section">
          <div className="pt-section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about payments, security, and refunds.</p>
          </div>
          <div className="pt-faq-list">
            {PAYMENT_FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* Back to Shop CTA */}
        <motion.div
          className="pt-cta"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h3>Ready to start styling?</h3>
          <p>Explore our premium collections and enjoy free shipping on prepaid orders.</p>
          <div className="pt-cta-buttons">
            <Link to="/shop" className="btn btn-primary">
              SHOP NOW <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="btn btn-outline">
              CONTACT SUPPORT
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentType;

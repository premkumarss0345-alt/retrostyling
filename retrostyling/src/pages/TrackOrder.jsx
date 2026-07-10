import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search, Package, Truck, MapPin, CheckCircle2, Clock, Phone,
  Download, ChevronRight, AlertCircle, RotateCcw, Circle
} from 'lucide-react';
import { orderService } from '../services/firestoreService';
import './TrackOrder.css';

const ORDER_STEPS = [
  { key: 'processing', label: 'Order Confirmed', desc: 'Your order has been received and confirmed.' },
  { key: 'packed',     label: 'Packed',          desc: 'Your items are carefully packed and ready.' },
  { key: 'shipped',    label: 'Shipped',          desc: 'Your order is on its way with our courier.' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Your package is out for delivery today.' },
  { key: 'delivered',  label: 'Delivered',        desc: 'Your order has been successfully delivered.' },
];

const STATUS_ORDER = ['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

const getStepIndex = (status) => {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDateShort = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TrackOrder = () => {
  const [orderId, setOrderId]   = useState('');
  const [contact, setContact]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [order, setOrder]       = useState(null);
  const [error, setError]       = useState('');
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim() || !contact.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setSearched(true);
    try {
      const result = await orderService.getByIdAndContact(orderId.trim(), contact.trim());
      if (result) {
        setOrder(result);
      } else {
        setError('No order found with this ID and contact. Please check and try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrder(null);
    setError('');
    setSearched(false);
    setOrderId('');
    setContact('');
  };

  const currentStepIdx = order ? getStepIndex(order.orderStatus) : -1;

  const getTimestampForStep = (stepKey) => {
    if (!order?.statusHistory) return null;
    const entry = order.statusHistory.find(h => h.status === stepKey);
    return entry?.timestamp || null;
  };

  const handleDownloadInvoice = () => {
    const content = `
RETROSTYLINGS — INVOICE
========================
Order ID: ${order.id.toUpperCase()}
Date: ${formatDateShort(order.createdAt)}
Customer: ${order.customerName}
Email: ${order.customerEmail}
Phone: ${order.phone}
Status: ${order.orderStatus}

ITEMS:
${order.items?.map(i => `  - ${i.name} (Qty: ${i.quantity}) ₹${(i.price * i.quantity).toLocaleString()}`).join('\n')}

Subtotal: ₹${order.items?.reduce((a, i) => a + i.price * i.quantity, 0).toLocaleString()}
Total: ₹${Number(order.total).toLocaleString()}

Shipping Address: ${order.shippingAddress}
${order.trackingNumber ? `Tracking Number: ${order.trackingNumber}` : ''}
${order.courierPartner ? `Courier: ${order.courierPartner}` : ''}

Thank you for shopping with Retrostylings!
    `.trim();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.id.slice(-8).toUpperCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="to-page">
      <div className="to-hero">
        <div className="to-hero-glow" />
        <motion.div
          className="to-hero-content container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="to-hero-icon"><Package size={32} /></div>
          <h1 className="to-hero-title">Track Your Order</h1>
          <p className="to-hero-subtitle">Enter your Order ID and email or phone number to track your shipment.</p>
        </motion.div>
      </div>

      <div className="to-body container">
        {/* Search Form */}
        <motion.div
          className="to-search-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <form className="to-form" onSubmit={handleTrack}>
            <div className="to-form-row">
              <div className="to-form-group">
                <label htmlFor="to-order-id">Order ID</label>
                <input
                  id="to-order-id"
                  type="text"
                  placeholder="e.g. A1B2C3D4..."
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  required
                />
              </div>
              <div className="to-form-group">
                <label htmlFor="to-contact">Email or Mobile Number</label>
                <input
                  id="to-contact"
                  type="text"
                  placeholder="e.g. user@email.com or 9876543210"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="to-form-actions">
              <button type="submit" className="btn btn-primary to-track-btn" disabled={loading}>
                {loading ? (
                  <><div className="to-btn-spinner" /> Tracking...</>
                ) : (
                  <><Search size={18} /> Track Order</>
                )}
              </button>
              {searched && (
                <button type="button" className="btn btn-outline to-reset-btn" onClick={handleReset}>
                  <RotateCcw size={16} /> New Search
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="to-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tracking Result */}
        <AnimatePresence>
          {order && (
            <motion.div
              className="to-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Order Header */}
              <div className="to-order-header">
                <div className="to-order-id-block">
                  <span className="to-order-label">Order</span>
                  <h2 className="to-order-id">#{order.id.slice(-8).toUpperCase()}</h2>
                  <span className={`to-status-badge to-status--${order.orderStatus}`}>
                    {order.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="to-order-actions">
                  <button className="to-action-btn" onClick={handleDownloadInvoice} title="Download Invoice">
                    <Download size={16} />
                    <span>Invoice</span>
                  </button>
                </div>
              </div>

              {/* Info Cards */}
              <div className="to-info-grid">
                <div className="to-info-card">
                  <div className="to-info-label"><Package size={14} /> Customer</div>
                  <div className="to-info-val">{order.customerName}</div>
                  <div className="to-info-sub">{order.customerEmail}</div>
                </div>
                {order.courierPartner && (
                  <div className="to-info-card">
                    <div className="to-info-label"><Truck size={14} /> Courier</div>
                    <div className="to-info-val">{order.courierPartner}</div>
                    {order.trackingNumber && (
                      <div className="to-info-sub">#{order.trackingNumber}</div>
                    )}
                  </div>
                )}
                {order.estimatedDelivery && (
                  <div className="to-info-card">
                    <div className="to-info-label"><Clock size={14} /> Estimated Delivery</div>
                    <div className="to-info-val">{order.estimatedDelivery}</div>
                  </div>
                )}
                <div className="to-info-card">
                  <div className="to-info-label"><MapPin size={14} /> Shipping Address</div>
                  <div className="to-info-val to-info-addr">{order.shippingAddress}</div>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="to-timeline-section">
                <h3 className="to-timeline-title">Tracking Progress</h3>
                <div className="to-timeline">
                  {ORDER_STEPS.map((step, i) => {
                    const isDone    = i <= currentStepIdx;
                    const isCurrent = i === currentStepIdx;
                    const timestamp = getTimestampForStep(step.key);
                    return (
                      <div key={step.key} className={`to-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                        <div className="to-step-left">
                          <div className="to-step-icon">
                            {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </div>
                          {i < ORDER_STEPS.length - 1 && (
                            <div className={`to-step-line ${isDone ? 'done' : ''}`} />
                          )}
                        </div>
                        <div className="to-step-right">
                          <div className="to-step-header">
                            <h4 className="to-step-label">{step.label}</h4>
                            {timestamp && (
                              <span className="to-step-time">{new Date(timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                          </div>
                          <p className="to-step-desc">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Support */}
              <div className="to-support-row">
                <Phone size={16} />
                <span>Need help with your order?</span>
                <Link to="/contact">Contact Support <ChevronRight size={14} /></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        {!order && !searched && (
          <motion.div
            className="to-tips"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3>Where to find your Order ID?</h3>
            <div className="to-tips-grid">
              <div className="to-tip-card">
                <Package size={20} />
                <h4>Order Confirmation Email</h4>
                <p>Check the order confirmation email sent to your inbox right after placing the order.</p>
              </div>
              <div className="to-tip-card">
                <MapPin size={20} />
                <h4>My Account → Orders</h4>
                <p>Log in to your account and go to My Orders to find your Order ID.</p>
              </div>
              <div className="to-tip-card">
                <Clock size={20} />
                <h4>SMS Notification</h4>
                <p>We send your Order ID via SMS when you place an order successfully.</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;

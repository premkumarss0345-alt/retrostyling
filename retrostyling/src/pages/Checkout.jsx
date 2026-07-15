import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, CreditCard, ShieldCheck, ChevronLeft, Truck, Calendar } from 'lucide-react';
import Toast from '../components/Toast';
import { cartService, orderService, shippingSettingsService } from '../services/firestoreService';
import { useAuth } from '../services/AuthContext';
import './Checkout.css';

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState({ show: false, message: '', type: 'success' });
  const [formData, setFormData]   = useState({ shippingAddress: '', phone: '', city: '', pincode: '' });
  const [shippingSettings, setShippingSettings] = useState({ freeShippingLimit: 999, standardCharge: 99, minDeliveryDays: 3, maxDeliveryDays: 7 });
  const [selectedPayment, setSelectedPayment] = useState('cod'); // 'cod' or 'razorpay'

  const { currentUser }  = useAuth();
  const navigate         = useNavigate();

  useEffect(() => {
    // Dynamic Razorpay SDK script injection
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    loadCart();
    shippingSettingsService.get().then(s => {
      if (s) {
        setShippingSettings({
          freeShippingLimit: s.freeShippingLimit ?? 999,
          standardCharge: s.standardCharge ?? 99,
          minDeliveryDays: s.minDeliveryDays ?? 3,
          maxDeliveryDays: s.maxDeliveryDays ?? 7,
        });
      }
    }).catch(() => {});
  }, [currentUser]);

  const loadCart = async () => {
    try {
      const items = await cartService.get(currentUser.uid);
      if (items.length === 0) navigate('/cart');
      setCartItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getItemPrice = (item) => {
    if (item.price_override) return Number(item.price_override);
    return item.on_sale ? Number(item.discount_price) : Number(item.price);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + getItemPrice(item) * item.quantity, 0);
  const shipping = subtotal > shippingSettings.freeShippingLimit ? 0 : shippingSettings.standardCharge;
  const total    = subtotal + shipping;

  const getEstimatedDelivery = () => {
    const today = new Date();
    const minDate = new Date(today); minDate.setDate(today.getDate() + shippingSettings.minDeliveryDays);
    const maxDate = new Date(today); maxDate.setDate(today.getDate() + shippingSettings.maxDeliveryDays);
    const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${fmt(minDate)} – ${fmt(maxDate)}`;
  };

  const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fullAddress = `${formData.shippingAddress}, ${formData.city} - ${formData.pincode}`;

    let pMethod = 'cod';
    let pStatus = 'pending';
    let pId = null;

    try {
      if (selectedPayment === 'razorpay') {
        if (!window.Razorpay) {
          throw new Error('Razorpay SDK is loading. Please wait a moment and try again.');
        }

        const paymentResult = await new Promise((resolve, reject) => {
          const options = {
            key: 'rzp_test_demokey', // Razorpay Test Key
            amount: total * 100, // Amount in paise
            currency: 'INR',
            name: 'RetroStylings',
            description: 'Order Payment (UPI/Scanner)',
            image: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=128&h=128&fit=crop',
            handler: function (response) {
              if (response.razorpay_payment_id) {
                resolve(response.razorpay_payment_id);
              } else {
                reject(new Error('Razorpay payment ID was missing.'));
              }
            },
            prefill: {
              name: currentUser.displayName || '',
              email: currentUser.email || '',
              contact: formData.phone || ''
            },
            notes: {
              address: fullAddress
            },
            theme: {
              color: '#8B5CF6'
            },
            modal: {
              ondismiss: function () {
                reject(new Error('Payment cancelled by user.'));
              }
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        });

        pMethod = 'upi_scanner';
        pStatus = 'paid';
        pId = paymentResult;
      }

      await orderService.place({
        cartItems,
        shippingAddress: fullAddress,
        phone: formData.phone,
        userInfo: currentUser,
        paymentMethod: pMethod,
        paymentStatus: pStatus,
        paymentId: pId
      });

      setToast({ show: true, message: 'Order placed successfully!', type: 'success' });
      setTimeout(() => navigate('/order-success'), 1500);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: err.message || 'Failed to place order. Try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container section center-loading">Preparing checkout...</div>;

  return (
    <motion.div
      className="checkout-page section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="container">
        <Link to="/cart" className="back-link"><ChevronLeft size={18} /> Back to Cart</Link>
        <h1 className="h2 title-centered">Checkout</h1>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <motion.div className="checkout-section">
              <h3><MapPin size={20} /> Shipping Information</h3>
              <div className="form-group">
                <label>Delivery Address</label>
                <textarea name="shippingAddress" required placeholder="House No, Street, Landmark..." onChange={handleInput} rows="3" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input type="text" name="city" required placeholder="Chennai" onChange={handleInput} />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input type="text" name="pincode" required placeholder="600001" onChange={handleInput} />
                </div>
              </div>
              <div className="form-group">
                <label><Phone size={14} /> Contact Number</label>
                <input type="tel" name="phone" required placeholder="+91 XXXXX XXXXX" onChange={handleInput} />
              </div>
            </motion.div>

            <motion.div className="checkout-section">
              <h3><CreditCard size={20} /> Payment Method</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  className={`payment-option ${selectedPayment === 'cod' ? 'selected' : ''}`}
                  onClick={() => setSelectedPayment('cod')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1.1rem', borderRadius: '12px', background: 'var(--bg-card)',
                    border: selectedPayment === 'cod' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                  }}
                >
                  <CreditCard size={24} color={selectedPayment === 'cod' ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                  <div className="payment-text">
                    <strong style={{ color: selectedPayment === 'cod' ? 'var(--primary)' : 'var(--white)', fontSize: '0.9rem' }}>Cash on Delivery (COD)</strong>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Safe and easy. Pay when your order arrives.</p>
                  </div>
                </div>

                <div
                  className={`payment-option ${selectedPayment === 'razorpay' ? 'selected' : ''}`}
                  onClick={() => setSelectedPayment('razorpay')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1.1rem', borderRadius: '12px', background: 'var(--bg-card)',
                    border: selectedPayment === 'razorpay' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: selectedPayment === 'razorpay' ? 'rgba(223,255,27,0.1)' : 'var(--bg-soft)', borderRadius: '6px', color: selectedPayment === 'razorpay' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.62rem', fontWeight: '900', border: '1px solid var(--border)', flexShrink: 0, textTransform: 'uppercase' }}>
                    UPI
                  </div>
                  <div className="payment-text">
                    <strong style={{ color: selectedPayment === 'razorpay' ? 'var(--primary)' : 'var(--white)', fontSize: '0.9rem' }}>UPI / QR Scanner / Card (Razorpay)</strong>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Pay securely online using Razorpay Sandbox.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div>
              <button type="submit" className="btn btn-primary checkout-pay-btn" disabled={submitting}>
                {submitting ? 'PLACING ORDER...' : `Place Order • ₹${total.toLocaleString()}`}
              </button>
              <p className="secure-text"><ShieldCheck size={16} /> Secure Checkout - SSL Encrypted</p>
            </motion.div>
          </form>

          <aside className="checkout-summary">
            <div className="summary-card">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {cartItems.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="summary-item">
                    <img src={item.image} alt={item.name} />
                    <div className="item-detail">
                      <h4>{item.name}</h4>
                      <p>Qty: {item.quantity} • {item.size || 'Standard'}</p>
                    </div>
                    <div className="item-price">₹{(getItemPrice(item) * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="summary-details">
                <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                <div className="summary-row">
                  <span className="flex-center gap-1"><Truck size={14} /> Shipping</span>
                  <span className={shipping === 0 ? 'free-tag' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                {shipping > 0 && <p className="shipping-hint">Add ₹{Math.max(0, shippingSettings.freeShippingLimit - subtotal)} more for free shipping!</p>}
                <div className="summary-row" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: 'none', paddingTop: 0 }}>
                  <span className="flex-center gap-1"><Calendar size={13} /> Estimated Delivery</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>{getEstimatedDelivery()}</span>
                </div>
                <div className="summary-row total"><span>Total Amount</span><span>₹{total.toLocaleString()}</span></div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Toast isOpen={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </motion.div>
  );
};

export default Checkout;
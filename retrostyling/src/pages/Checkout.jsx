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
  const [selectedPayment, setSelectedPayment] = useState('cod'); // 'cod', 'razorpay_modal', or 'razorpay_link_qr'
  const [showQRModal, setShowQRModal] = useState(false);
  const [payLink, setPayLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [tempOrderData, setTempOrderData] = useState(null);

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
      if (selectedPayment === 'razorpay_modal') {
        if (!window.Razorpay) {
          throw new Error('Razorpay SDK is loading. Please wait a moment and try again.');
        }

        const paymentResult = await new Promise((resolve, reject) => {
          const options = {
            key: 'rzp_test_TETHQUCGGso1F5', // Razorpay Test Key
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
      } else if (selectedPayment === 'razorpay_link_qr') {
        const linkId = Math.random().toString(36).substr(2, 9);
        const linkUrl = `https://rzp.io/i/rt_${linkId}`;
        const upiUri = `upi://pay?pa=retrostylings@razorpay&pn=RetroStylings&am=${total}&cu=INR&tn=RT_${linkId}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=8b5cf6&data=${encodeURIComponent(upiUri)}`;

        setPayLink(linkUrl);
        setQrCodeUrl(qrUrl);
        setTempOrderData({
          cartItems,
          shippingAddress: fullAddress,
          phone: formData.phone,
          userInfo: currentUser
        });
        setShowQRModal(true);
        setSubmitting(false);
        return; // Pause submit flow for user verification in modal
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

  const confirmQRLinkPayment = async () => {
    if (!tempOrderData) return;
    setSubmitting(true);
    try {
      const pId = 'pay_link_' + Math.random().toString(36).substr(2, 9);
      await orderService.place({
        cartItems: tempOrderData.cartItems,
        shippingAddress: tempOrderData.shippingAddress,
        phone: tempOrderData.phone,
        userInfo: tempOrderData.userInfo,
        paymentMethod: 'razorpay_link_qr',
        paymentStatus: 'paid',
        paymentId: pId
      });
      setShowQRModal(false);
      setToast({ show: true, message: 'Order placed successfully!', type: 'success' });
      setTimeout(() => navigate('/order-success'), 1500);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to verify payment link. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
      setTempOrderData(null);
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
                {/* Cash On Delivery Option */}
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

                {/* Razorpay Standard Card Modal Option */}
                <div
                  className={`payment-option ${selectedPayment === 'razorpay_modal' ? 'selected' : ''}`}
                  onClick={() => setSelectedPayment('razorpay_modal')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1.1rem', borderRadius: '12px', background: 'var(--bg-card)',
                    border: selectedPayment === 'razorpay_modal' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: selectedPayment === 'razorpay_modal' ? 'rgba(223,255,27,0.1)' : 'var(--bg-soft)', borderRadius: '6px', color: selectedPayment === 'razorpay_modal' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '900', border: '1px solid var(--border)', flexShrink: 0, textTransform: 'uppercase' }}>
                    SDK
                  </div>
                  <div className="payment-text">
                    <strong style={{ color: selectedPayment === 'razorpay_modal' ? 'var(--primary)' : 'var(--white)', fontSize: '0.9rem' }}>Cards / Netbanking (Razorpay Box)</strong>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Pay with card or bank inside standard Razorpay popup.</p>
                  </div>
                </div>

                {/* Razorpay Link & QR Code Simulator Option */}
                <div
                  className={`payment-option ${selectedPayment === 'razorpay_link_qr' ? 'selected' : ''}`}
                  onClick={() => setSelectedPayment('razorpay_link_qr')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1.1rem', borderRadius: '12px', background: 'var(--bg-card)',
                    border: selectedPayment === 'razorpay_link_qr' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: selectedPayment === 'razorpay_link_qr' ? 'rgba(223,255,27,0.1)' : 'var(--bg-soft)', borderRadius: '6px', color: selectedPayment === 'razorpay_link_qr' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '900', border: '1px solid var(--border)', flexShrink: 0, textTransform: 'uppercase' }}>
                    UPI
                  </div>
                  <div className="payment-text">
                    <strong style={{ color: selectedPayment === 'razorpay_link_qr' ? 'var(--primary)' : 'var(--white)', fontSize: '0.9rem' }}>UPI QR Scanner & Payment Link</strong>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Scan UPI QR code or open a customized Razorpay Payment Link.</p>
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

      {showQRModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setShowQRModal(false)}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', borderRadius: '50%', marginBottom: '1rem' }}>
                <CreditCard size={24} />
              </div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--white)', margin: '0 0 0.5rem 0' }}>Razorpay UPI & Scanner Link</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Scan the QR code using any UPI app or click the secure link button below to complete the transaction.
              </p>
            </div>

            <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem', boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.2)' }}>
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="UPI QR Code" style={{ borderRadius: '8px', border: '4px solid white', width: '200px', height: '200px' }} />
              ) : (
                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Generating QR...</div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <a
                href={payLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  background: 'rgba(139, 92, 246, 0.15)', border: '1px solid var(--primary)',
                  borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--primary)',
                  fontSize: '0.88rem', fontWeight: 'bold', textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
              >
                Go to Razorpay Link
              </a>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Amount: <strong style={{ color: 'var(--primary)' }}>₹{total.toLocaleString()}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowQRModal(false)}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmQRLinkPayment}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting ? 'Confirming...' : 'I Have Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast isOpen={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </motion.div>
  );
};

export default Checkout;
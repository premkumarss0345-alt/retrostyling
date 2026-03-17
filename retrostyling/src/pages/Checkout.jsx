import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, CreditCard, ShieldCheck, ChevronLeft, Truck } from 'lucide-react';
import Toast from '../components/Toast';
import { cartService, orderService } from '../services/firestoreService';
import { useAuth } from '../services/AuthContext';
import './Checkout.css';

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState({ show: false, message: '', type: 'success' });
  const [formData, setFormData]   = useState({ shippingAddress: '', phone: '', city: '', pincode: '' });

  const { currentUser }  = useAuth();
  const navigate         = useNavigate();

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    loadCart();
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
  const shipping = subtotal > 999 ? 0 : 99;
  const total    = subtotal + shipping;

  const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fullAddress = `${formData.shippingAddress}, ${formData.city} - ${formData.pincode}`;
    try {
      await orderService.place({
        cartItems,
        shippingAddress: fullAddress,
        phone: formData.phone,
        userInfo: currentUser,
      });
      setToast({ show: true, message: 'Order placed successfully!', type: 'success' });
      setTimeout(() => navigate('/order-success'), 1500);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to place order. Try again.', type: 'error' });
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
              <div className="payment-option selected">
                <CreditCard size={24} color="var(--primary)" />
                <div className="payment-text">
                  <strong>Cash on Delivery (COD)</strong>
                  <p>Safe and easy. Pay when your order arrives.</p>
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
                {shipping > 0 && <p className="shipping-hint">Add ₹{Math.max(0, 999 - subtotal)} more for free shipping!</p>}
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
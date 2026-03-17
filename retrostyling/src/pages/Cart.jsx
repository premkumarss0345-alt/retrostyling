import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../components/Toast';
import { cartService } from '../services/firestoreService';
import { useAuth } from '../services/AuthContext';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState({ show: false, message: '', type: 'success' });
  const { currentUser }           = useAuth();
  const navigate                  = useNavigate();

  useEffect(() => {
    if (currentUser) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadCart = async () => {
    try {
      const items = await cartService.get(currentUser.uid);
      setCartItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (item, newQty) => {
    if (newQty < 1) return;
    try {
      const updated = await cartService.updateQuantity(item.productId, item.variantId, newQty);
      setCartItems(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (item) => {
    try {
      const updated = await cartService.removeItem(item.productId, item.variantId);
      setCartItems(updated);
      setToast({ show: true, message: 'Item removed from cart', type: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  const getItemPrice = (item) => {
    if (item.price_override) return Number(item.price_override);
    return item.on_sale ? Number(item.discount_price) : Number(item.price);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + getItemPrice(item) * item.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 99;
  const total    = subtotal + shipping;

  if (!currentUser) {
    return (
      <div className="container section flex-center" style={{ flexDirection: 'column', minHeight: '60vh', textAlign: 'center' }}>
        <ShoppingBag size={80} strokeWidth={1} />
        <h2 className="h2" style={{ marginBottom: '1rem' }}>Please log in to view your cart</h2>
        <Link to="/login" className="btn btn-primary btn-hero">Sign In</Link>
      </div>
    );
  }

  if (loading) return <div className="container section center-loading">Loading your cart...</div>;

  if (cartItems.length === 0) {
    return (
      <motion.div
        className="container section flex-center"
        style={{ flexDirection: 'column', textAlign: 'center', minHeight: '60vh' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <div className="empty-cart-icon"><ShoppingBag size={100} strokeWidth={1} /></div>
        <h2 className="h2" style={{ textTransform: 'none', marginBottom: '1rem' }}>Your cart is empty</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '2rem', maxWidth: '400px' }}>
          Looks like you haven't added anything yet. Explore our collection!
        </p>
        <Link to="/shop" className="btn btn-primary btn-hero">Start Shopping <ArrowRight size={20} /></Link>
      </motion.div>
    );
  }

  return (
    <motion.div className="cart-page section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container">
        <div className="flex-between" style={{ marginBottom: '2rem', alignItems: 'flex-end' }}>
          <div>
            <Link to="/shop" className="back-link" style={{ marginBottom: '0.5rem' }}>
              <ChevronLeft size={18} /> Continue Shopping
            </Link>
            <h1 className="h2" style={{ textTransform: 'none', letterSpacing: '-1px' }}>Your Cart</h1>
          </div>
          <p className="text-light">{cartItems.length} Items</p>
        </div>

        <div className="cart-layout">
          <div className="cart-items-list">
            <AnimatePresence>
              {cartItems.map((item, idx) => (
                <motion.div
                  key={`${item.productId}-${item.variantId}-${idx}`}
                  className="cart-item-card"
                  layout
                  exit={{ opacity: 0, x: -50 }}
                >
                  <div className="cart-item-img-wrapper">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="cart-item-main">
                    <div className="flex-between">
                      <h3 className="cart-item-title">{item.name}</h3>
                      <button className="remove-btn" onClick={() => removeItem(item)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="variant-info">
                      {item.size  && <span>Size: {item.size}</span>}
                      {item.color && <span> • Color: {item.color}</span>}
                    </p>
                    <div className="cart-item-footer">
                      <div className="qty-picker">
                        <button onClick={() => updateQuantity(item, item.quantity - 1)} className="qty-action">
                          <Minus size={14} />
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item, item.quantity + 1)} className="qty-action">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="cart-item-price">
                        ₹{(getItemPrice(item) * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <aside className="cart-sidebar">
            <div className="summary-card sticky-sidebar">
              <h3>Order Summary</h3>
              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'free-tag' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <div className="shipping-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, (subtotal / 999) * 100)}%` }} />
                    </div>
                    <p>Add ₹{999 - subtotal} more for **FREE SHIPPING**</p>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total</span><span>₹{total.toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn btn-primary btn-checkout w-100">
                Checkout Now <ArrowRight size={20} />
              </button>
            </div>
          </aside>
        </div>
      </div>

      <Toast isOpen={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
    </motion.div>
  );
};

export default Cart;

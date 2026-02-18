import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../components/Toast';
import { API_BASE_URL } from '../config';
import './Cart.css';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/cart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setCartItems(data);
            } else {
                console.error('Cart data is not an array:', data);
                setCartItems([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (id, newQty) => {
        if (newQty < 1) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/cart/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: newQty })
            });
            if (res.ok) {
                setCartItems(cartItems.map(item => item.id === id ? { ...item, quantity: newQty } : item));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const removeItem = async (id) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/cart/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setCartItems(cartItems.filter(item => item.id !== id));
                setToast({ show: true, message: 'Item removed from cart', type: 'success' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const subtotal = cartItems.reduce((acc, item) => {
        const price = item.on_sale ? item.discount_price : item.price;
        return acc + (price * item.quantity);
    }, 0);

    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal + shipping;

    if (loading) return <div className="container section center-loading">Loading your shoping cart...</div>;

    if (cartItems.length === 0) {
        return (
            <motion.div
                className="container section flex-center"
                style={{ flexDirection: 'column', textAlign: 'center', minHeight: '60vh' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="empty-cart-icon">
                    <ShoppingBag size={100} strokeWidth={1} />
                </div>
                <h2 className="h2" style={{ textTransform: 'none', marginBottom: '1rem' }}>Your cart is empty</h2>
                <p style={{ color: 'var(--text-light)', marginBottom: '2rem', maxWidth: '400px' }}>
                    Looks like you haven't added anything to your cart yet. Explore our latest collection and find something you love!
                </p>
                <Link to="/shop" className="btn btn-primary btn-hero">
                    Start Shopping <ArrowRight size={20} />
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="cart-page section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
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
                            {cartItems.map(item => (
                                <motion.div
                                    key={item.id}
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
                                            <button
                                                className="remove-btn"
                                                onClick={() => removeItem(item.id)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <p className="variant-info">
                                            {item.size && <span>Size: {item.size}</span>}
                                            {item.color && <span> • Color: {item.color}</span>}
                                        </p>
                                        <div className="cart-item-footer">
                                            <div className="qty-picker">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="qty-action"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="qty-value">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="qty-action"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <div className="cart-item-price">
                                                ₹{(Number(item.on_sale ? item.discount_price : item.price) * item.quantity).toLocaleString()}
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
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toLocaleString()}</span>
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
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${Math.min(100, (subtotal / 999) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <p>Add ₹{999 - subtotal} more for **FREE SHIPPING**</p>
                                    </div>
                                )}
                                <div className="summary-row total">
                                    <span>Total</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/checkout')}
                                className="btn btn-primary btn-checkout w-100"
                            >
                                Checkout Now <ArrowRight size={20} />
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
            <Toast
                isOpen={toast.show}
                message={toast.message}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </motion.div>
    );
};
export default Cart;

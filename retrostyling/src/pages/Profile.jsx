import React, { useState, useEffect } from 'react';
import { User, Package, Calendar, Clock, ChevronRight, ChevronDown, MapPin, Phone } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState({});

    useEffect(() => {
        fetchProfile();
        fetchOrders();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUser(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                console.error('Orders data is not an array:', data);
                setOrders([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleOrderDetails = async (orderId) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
            return;
        }

        setExpandedOrder(orderId);

        if (!orderDetails[orderId]) {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_BASE_URL}/api/orders/my-orders/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setOrderDetails(prev => ({ ...prev, [orderId]: data }));
            } catch (err) {
                console.error(err);
            }
        }
    };

    if (loading) return (
        <div className="profile-page flex-center" style={{ height: '80vh' }}>
            <div className="loader-text">SYNCING YOUR PROFILE...</div>
        </div>
    );

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-unified-container">
                    {/* 👤 Left Sidebar */}
                    <aside className="profile-sidebar">
                        <div className="sidebar-profile-header">
                            <div className="user-avatar-large">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="user-info-text">
                                <h2>{user?.name}</h2>
                                <p className="user-email">{user?.email}</p>
                                <span className="user-role-badge">{user?.role}</span>
                            </div>
                        </div>

                        <div className="profile-nav-vertical">
                            <button className="nav-item active">
                                <User size={18} /> Overview
                            </button>
                            <button className="nav-item">
                                <Package size={18} /> Settings
                            </button>
                            <button className="nav-item">
                                <Clock size={18} /> Log Activity
                            </button>
                        </div>
                    </aside>

                    {/* 📦 Right Content Area */}
                    <main className="profile-content-area">
                        <div className="content-header">
                            <h1>Order History</h1>
                            <p>Seamlessly track and manage your fashion investments.</p>
                        </div>

                        <div className="orders-grid-header desktop-only">
                            <span>Order ID</span>
                            <span>Placement Date</span>
                            <span>Items Count</span>
                            <span>Total Amount</span>
                            <span>Status</span>
                        </div>

                        <div className="orders-list">
                            {orders.length === 0 ? (
                                <div className="empty-state">
                                    <Package size={80} strokeWidth={0.5} />
                                    <p>Your wardrobe is waiting for its first addition.</p>
                                </div>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="order-row-card">
                                        <div className="order-row-summary" onClick={() => toggleOrderDetails(order.id)}>
                                            <span className="order-id">#{order.id}</span>
                                            <span className="order-date">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span className="order-items-count">3 items</span>
                                            <span className="order-price">₹{Number(order.total).toLocaleString()}</span>
                                            <span className={`status-pill pill-${order.order_status}`}>
                                                {order.order_status}
                                            </span>
                                        </div>

                                        {expandedOrder === order.id && (
                                            <div className="order-expanded-details">
                                                <div className="order-meta-info">
                                                    <div>
                                                        <p><MapPin size={14} /> <strong>Shipping to:</strong></p>
                                                        <p>{order.shipping_address || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p><Phone size={14} /> <strong>Contact:</strong></p>
                                                        <p>{order.phone || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className="order-items-list">
                                                    {orderDetails[order.id]?.map((item, idx) => (
                                                        <div key={idx} className="order-item-mini">
                                                            <img src={item.image} alt={item.name} />
                                                            <div className="item-mini-info">
                                                                <h4>{item.name}</h4>
                                                                <p>Size: {item.size} | Quantity: {item.quantity}</p>
                                                            </div>
                                                            <div className="item-mini-price">
                                                                ₹{Number(item.price).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {!orderDetails[order.id] && <p className="loading-small">Syncing order details...</p>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Profile;

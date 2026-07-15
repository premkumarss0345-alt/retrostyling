import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { statsService, orderService } from '../../services/firestoreService';
import {
  Users, ShoppingBag, CreditCard, TrendingUp, Package,
  AlertCircle, ArrowUpRight, ArrowDownRight, Clock,
  CheckCircle, XCircle, RefreshCw, Download, Plus,
  ShoppingCart, Star, Percent, Eye, Activity, Link2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import './Dashboard.css';

/* ── Real chart data states are declared inside the component ── */

/* ── Animation variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ── Custom tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.value > 1000 ? `₹${p.value.toLocaleString()}` : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, label, value, change, changeType = 'up', color, prefix = '', suffix = '' }) => (
  <motion.div className="kpi-card" variants={itemVariants} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
    <div className="kpi-icon-wrap" style={{ background: color + '18', color }}>
      <Icon size={20} />
    </div>
    <div className="kpi-info">
      <span className="kpi-label">{label}</span>
      <h2 className="kpi-value">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</h2>
      {change !== undefined && (
        <span className={`kpi-change ${changeType}`}>
          {changeType === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {change}% vs last month
        </span>
      )}
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockCount: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    returns: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesDataState, setSalesDataState] = useState([]);
  const [weeklyDataState, setWeeklyDataState] = useState([]);
  const [categoryDataState, setCategoryDataState] = useState([]);
  const [customerGrowthState, setCustomerGrowthState] = useState([]);
  const [orderStatusDataState, setOrderStatusDataState] = useState([]);
  const [topProductsState, setTopProductsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  // Inline Link states for Common Board recent orders list
  const [editingLinkOrderId, setEditingLinkOrderId] = useState(null);
  const [tempPaymentLink, setTempPaymentLink] = useState('');
  const [savingLinkId, setSavingLinkId] = useState(null);

  const saveOrderPaymentLink = async (orderId) => {
    setSavingLinkId(orderId);
    try {
      await orderService.update(orderId, { paymentLink: tempPaymentLink });
      setRecentOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentLink: tempPaymentLink } : o));
      setEditingLinkOrderId(null);
      setTempPaymentLink('');
    } catch (err) {
      console.error(err);
      alert('Failed to save payment link');
    } finally {
      setSavingLinkId(null);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const data = await statsService.get();
      if (data.stats) setStats(data.stats);
      if (Array.isArray(data.recentOrders)) setRecentOrders(data.recentOrders);
      if (Array.isArray(data.salesData)) setSalesDataState(data.salesData);
      if (Array.isArray(data.weeklyData)) setWeeklyDataState(data.weeklyData);
      if (Array.isArray(data.categoryData)) setCategoryDataState(data.categoryData);
      if (Array.isArray(data.customerGrowth)) setCustomerGrowthState(data.customerGrowth);
      if (Array.isArray(data.orderStatusData)) setOrderStatusDataState(data.orderStatusData);
      if (Array.isArray(data.topProducts)) setTopProductsState(data.topProducts);
    } catch (err) {
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getStatusBadge = (status) => {
    const map = {
      processing: 'badge badge-info',
      pending: 'badge badge-warning',
      shipped: 'badge',
      delivered: 'badge badge-success',
      cancelled: 'badge badge-error',
      completed: 'badge badge-success',
    };
    return map[status] || 'badge badge-neutral';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="dash-loading">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton kpi-card-skeleton" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div className="dashboard-page" initial="hidden" animate="visible" variants={containerVariants}>

        {/* Page Header */}
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Business Overview</h1>
            <p className="page-subtitle">Welcome back — here's what's happening with your store today.</p>
          </div>
          <div className="page-actions">
            <div className="period-tabs">
              {['7d', '30d', '90d', '1y'].map(p => (
                <button key={p} className={`period-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                  {p}
                </button>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadStats}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-primary btn-sm">
              <Download size={14} /> Export
            </button>
          </div>
        </motion.div>

        {/* KPI Grid */}
        <div className="kpi-grid">
          <StatCard icon={CreditCard} label="Total Revenue" value={stats.totalRevenue} prefix="₹" change={stats.totalOrders > 0 ? 24.3 : 0} changeType="up" color="#DFFF1B" />
          <StatCard icon={TrendingUp} label="Today's Revenue" value={stats.todayRevenue} prefix="₹" change={stats.todayRevenue > 0 ? 12.1 : 0} changeType="up" color="#22C55E" />
          <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders} change={stats.totalOrders > 0 ? 8.2 : 0} changeType="up" color="#3B82F6" />
          <StatCard icon={Users} label="Customers" value={stats.totalUsers} change={stats.totalUsers > 0 ? 15.4 : 0} changeType="up" color="#8B5CF6" />
          <StatCard icon={Package} label="Products" value={stats.totalProducts} color="#00F5FF" />
          <StatCard icon={AlertCircle} label="Low Stock" value={stats.lowStockCount} changeType="down" color="#F59E0B" />
          <StatCard icon={Clock} label="Pending Orders" value={stats.pendingOrders} changeType="down" change={stats.pendingOrders > 0 ? 3.2 : 0} color="#FF4D4D" />
          <StatCard icon={RefreshCw} label="Returns" value={stats.returns} change={stats.returns > 0 ? 2.1 : 0} changeType="down" color="#F59E0B" />
        </div>

        {/* Charts Row 1 */}
        <div className="charts-grid-main">
          {/* Revenue Area Chart */}
          <motion.div className="chart-card" variants={itemVariants}>
            <div className="chart-card-header">
              <div>
                <h3>Revenue Analytics</h3>
                <p>Monthly revenue trend</p>
              </div>
              <span className="badge badge-success">↑ 24.3%</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={salesDataState}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DFFF1B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#DFFF1B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#DFFF1B" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Weekly Sales Bar */}
          <motion.div className="chart-card" variants={itemVariants}>
            <div className="chart-card-header">
              <div>
                <h3>Weekly Sales</h3>
                <p>This week's performance</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyDataState} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" name="Sales (₹)" fill="#DFFF1B" radius={[6, 6, 0, 0]} opacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="charts-grid-secondary">
          {/* Customer Growth */}
          <motion.div className="chart-card" variants={itemVariants}>
            <div className="chart-card-header">
              <div>
                <h3>Customer Growth</h3>
                <p>New vs returning customers</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={customerGrowthState}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="new" name="New" stroke="#DFFF1B" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="returning" name="Returning" stroke="#8B5CF6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Category Pie */}
          <motion.div className="chart-card" variants={itemVariants}>
            <div className="chart-card-header">
              <div>
                <h3>Category Sales</h3>
                <p>Revenue by category</p>
              </div>
            </div>
            <div className="pie-chart-wrapper">
              {categoryDataState.length === 0 ? (
                <div className="empty-state" style={{ height: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <p style={{ color: 'var(--text-light)', fontSize: 13 }}>No category sales data yet.</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={categoryDataState} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {categoryDataState.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `${val}%`} contentStyle={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {categoryDataState.map(c => (
                      <div key={c.name} className="pie-legend-item">
                        <span className="pie-legend-dot" style={{ background: c.color }} />
                        <span>{c.name}</span>
                        <span className="pie-legend-val">{c.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Order Status */}
          <motion.div className="chart-card" variants={itemVariants}>
            <div className="chart-card-header">
              <div>
                <h3>Order Status</h3>
                <p>Current distribution</p>
              </div>
            </div>
            <div className="order-status-list">
              {orderStatusDataState.map((item) => {
                const total = orderStatusDataState.reduce((a, b) => a + b.count, 0);
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.status} className="order-status-row">
                    <span className="order-status-name">{item.status}</span>
                    <div className="order-status-bar-wrap">
                      <div className="order-status-bar">
                        <div className="order-status-fill" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                    <span className="order-status-count" style={{ color: item.color }}>{item.count}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Bottom Grid */}
        <div className="dash-bottom-grid">
          {/* Top Products */}
          <motion.div className="table-card" variants={itemVariants}>
            <div className="table-card-header">
              <h3>Top Selling Products</h3>
              <Link to="/admin/products" className="view-all-link">View All</Link>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Sales</th>
                    <th>Revenue</th>
                    <th>Stock</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductsState.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                        No sales data available yet.
                      </td>
                    </tr>
                  ) : (
                    topProductsState.map((p, i) => (
                      <tr key={i}>
                        <td className="text-muted">{i + 1}</td>
                        <td><span className="product-name-cell">{p.name}</span></td>
                        <td><strong>{p.sales}</strong></td>
                        <td>{p.revenue}</td>
                        <td>
                          <span className={p.stock < 15 ? 'badge badge-error' : 'badge badge-success'}>
                            {p.stock} left
                          </span>
                        </td>
                        <td>
                          {p.trend === 'up'
                            ? <span className="trend-up"><ArrowUpRight size={14} /></span>
                            : <span className="trend-down"><ArrowDownRight size={14} /></span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Recent Orders */}
          <motion.div className="table-card" variants={itemVariants}>
            <div className="table-card-header">
              <h3>Recent Orders</h3>
              <Link to="/admin/orders" className="view-all-link">View All</Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="recent-orders-list">
                {recentOrders.map((order) => (
                  <div key={order.id} className="recent-order-item" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                      <div className="order-avatar">{(order.customerName || 'C').charAt(0)}</div>
                      <div className="order-info" style={{ flex: 1 }}>
                        <p className="order-customer">{order.customerName || 'Customer'}</p>
                        <p className="order-id">#{order.id.slice(-6).toUpperCase()} · {formatDate(order.createdAt)}</p>
                      </div>
                      <span className={getStatusBadge(order.orderStatus)}>{order.orderStatus || 'pending'}</span>
                      <span className="order-amount" style={{ marginLeft: 'auto' }}>₹{order.total?.toLocaleString()}</span>
                      
                      <button
                        onClick={() => {
                          setEditingLinkOrderId(editingLinkOrderId === order.id ? null : order.id);
                          setTempPaymentLink(order.paymentLink || '');
                        }}
                        style={{
                          background: 'none', border: 'none', color: order.paymentLink ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginLeft: '0.5rem'
                        }}
                        title={order.paymentLink ? "Payment Link Associated" : "Attach Payment Link"}
                      >
                        <Link2 size={14} />
                      </button>
                    </div>

                    {editingLinkOrderId === order.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        style={{ display: 'flex', gap: '0.5rem', paddingLeft: '3rem', paddingBottom: '0.25rem' }}
                      >
                        <input
                          type="text"
                          value={tempPaymentLink}
                          onChange={(e) => setTempPaymentLink(e.target.value)}
                          placeholder="Paste Razorpay Payment Link..."
                          style={{
                            flex: 1, background: 'var(--bg-soft)', border: '1px solid var(--border)',
                            borderRadius: '6px', padding: '0.35rem 0.5rem', fontSize: '0.78rem', color: 'var(--white)',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => saveOrderPaymentLink(order.id)}
                          disabled={savingLinkId === order.id}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', minHeight: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {savingLinkId === order.id ? '...' : 'Save'}
                        </button>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><ShoppingBag size={28} /></div>
                <h3>No recent orders</h3>
                <p>Orders will appear here once customers start placing them.</p>
              </div>
            )}
          </motion.div>
        </div>

      </motion.div>
    </AdminLayout>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { statsService } from '../../services/firestoreService';
import {
  Users, ShoppingBag, CreditCard, TrendingUp, Package,
  AlertCircle, ArrowUpRight, ArrowDownRight, Clock,
  CheckCircle, XCircle, RefreshCw, Download, Plus,
  ShoppingCart, Star, Percent, Eye, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import './Dashboard.css';

/* ── Mock chart data ── */
const salesData = [
  { name: 'Jan', revenue: 42000, orders: 320 },
  { name: 'Feb', revenue: 56000, orders: 410 },
  { name: 'Mar', revenue: 48000, orders: 380 },
  { name: 'Apr', revenue: 71000, orders: 520 },
  { name: 'May', revenue: 65000, orders: 490 },
  { name: 'Jun', revenue: 88000, orders: 640 },
  { name: 'Jul', revenue: 95000, orders: 720 },
];

const weeklyData = [
  { name: 'Mon', sales: 4200 }, { name: 'Tue', sales: 3800 },
  { name: 'Wed', sales: 6100 }, { name: 'Thu', sales: 5400 },
  { name: 'Fri', sales: 7800 }, { name: 'Sat', sales: 9200 },
  { name: 'Sun', sales: 8600 },
];

const categoryData = [
  { name: 'Clothing', value: 42, color: '#DFFF1B' },
  { name: 'Footwear', value: 28, color: '#8B5CF6' },
  { name: 'Accessories', value: 18, color: '#00F5FF' },
  { name: 'Others', value: 12, color: '#F59E0B' },
];

const customerGrowth = [
  { name: 'Jan', new: 120, returning: 80 },
  { name: 'Feb', new: 160, returning: 110 },
  { name: 'Mar', new: 145, returning: 130 },
  { name: 'Apr', new: 200, returning: 160 },
  { name: 'May', new: 185, returning: 195 },
  { name: 'Jun', new: 230, returning: 220 },
  { name: 'Jul', new: 260, returning: 248 },
];

const topProducts = [
  { name: 'Premium Leather Jacket', sales: 214, revenue: '₹5,34,360', stock: 12, trend: 'up' },
  { name: 'Retro Denim Jeans', sales: 186, revenue: '₹2,79,000', stock: 34, trend: 'up' },
  { name: 'Vintage Sneakers', sales: 162, revenue: '₹2,43,000', stock: 8, trend: 'down' },
  { name: 'Classic Polo Shirt', sales: 148, revenue: '₹1,33,200', stock: 56, trend: 'up' },
  { name: 'Summer Floral Dress', sales: 134, revenue: '₹2,01,000', stock: 21, trend: 'up' },
];

const orderStatusData = [
  { status: 'Pending', count: 48, color: '#F59E0B' },
  { status: 'Processing', count: 92, color: '#3B82F6' },
  { status: 'Shipped', count: 67, color: '#00F5FF' },
  { status: 'Delivered', count: 234, color: '#22C55E' },
  { status: 'Cancelled', count: 18, color: '#FF4D4D' },
];

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
    totalUsers: 0, totalProducts: 0, totalOrders: 0,
    totalRevenue: 0, lowStockCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const data = await statsService.get();
      if (data.stats) setStats(data.stats);
      if (Array.isArray(data.recentOrders)) setRecentOrders(data.recentOrders);
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
          <StatCard icon={CreditCard} label="Total Revenue" value={stats.totalRevenue} prefix="₹" change={24.3} changeType="up" color="#DFFF1B" />
          <StatCard icon={TrendingUp} label="Today's Revenue" value={8420} prefix="₹" change={12.1} changeType="up" color="#22C55E" />
          <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders} change={8.2} changeType="up" color="#3B82F6" />
          <StatCard icon={Users} label="Customers" value={stats.totalUsers} change={15.4} changeType="up" color="#8B5CF6" />
          <StatCard icon={Package} label="Products" value={stats.totalProducts} color="#00F5FF" />
          <StatCard icon={AlertCircle} label="Low Stock" value={stats.lowStockCount} changeType="down" color="#F59E0B" />
          <StatCard icon={Clock} label="Pending Orders" value={48} changeType="down" change={3.2} color="#FF4D4D" />
          <StatCard icon={RefreshCw} label="Returns" value={12} change={2.1} changeType="down" color="#F59E0B" />
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
              <AreaChart data={salesData}>
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
              <BarChart data={weeklyData} barSize={28}>
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
              <LineChart data={customerGrowth}>
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
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} contentStyle={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {categoryData.map(c => (
                  <div key={c.name} className="pie-legend-item">
                    <span className="pie-legend-dot" style={{ background: c.color }} />
                    <span>{c.name}</span>
                    <span className="pie-legend-val">{c.value}%</span>
                  </div>
                ))}
              </div>
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
              {orderStatusData.map((item) => {
                const total = orderStatusData.reduce((a, b) => a + b.count, 0);
                const pct = Math.round((item.count / total) * 100);
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
                  {topProducts.map((p, i) => (
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
                  ))}
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
                  <div key={order.id} className="recent-order-item">
                    <div className="order-avatar">{(order.customerName || 'C').charAt(0)}</div>
                    <div className="order-info">
                      <p className="order-customer">{order.customerName || 'Customer'}</p>
                      <p className="order-id">#{order.id.slice(-6).toUpperCase()} · {formatDate(order.createdAt)}</p>
                    </div>
                    <span className={getStatusBadge(order.orderStatus)}>{order.orderStatus || 'pending'}</span>
                    <span className="order-amount">₹{order.total?.toLocaleString()}</span>
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

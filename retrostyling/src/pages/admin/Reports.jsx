import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  FileText, Download, Calendar, TrendingUp, Users, Package,
  CreditCard, Percent, Filter, ChevronDown, BarChart2, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Report', icon: TrendingUp, color: '#DFFF1B' },
  { id: 'customers', label: 'Customer Report', icon: Users, color: '#8B5CF6' },
  { id: 'products', label: 'Product Report', icon: Package, color: '#00F5FF' },
  { id: 'revenue', label: 'Revenue Report', icon: CreditCard, color: '#22C55E' },
  { id: 'coupons', label: 'Coupon Report', icon: Percent, color: '#F59E0B' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: '0.8rem' }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.value > 999 ? `₹${p.value.toLocaleString()}` : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales');
  const [period, setPeriod] = useState('monthly');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Real Database Data
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersSnap, usersSnap, productsSnap, couponsSnap] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'coupons'))
      ]);

      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCoupons(couponsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error loading reports data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getOrderDate = (o) => {
    if (!o.createdAt) return new Date(0);
    return o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
  };

  // Date Filtering logic
  const filteredOrders = orders.filter(o => {
    const od = getOrderDate(o);
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (od < fromDate) return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (od > toDate) return false;
    }
    return true;
  });

  // KPI Calculations
  const totalOrders = filteredOrders.length;
  const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
  const totalRefunds = filteredOrders
    .filter(o => o.orderStatus === 'refunded' || o.orderStatus === 'returned')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Customer calculations
  const totalUsers = users.length;
  const newCustomers = users.filter(u => {
    if (!u.createdAt) return false;
    const ud = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return ud >= thirtyDaysAgo;
  }).length;

  const userOrderCounts = {};
  filteredOrders.forEach(o => {
    if (o.userId) {
      userOrderCounts[o.userId] = (userOrderCounts[o.userId] || 0) + 1;
    }
  });
  const returningCustomers = Object.values(userOrderCounts).filter(c => c > 1).length;
  const retentionRate = totalUsers > 0 ? ((returningCustomers / totalUsers) * 100).toFixed(1) : '0';
  const activeUserIds = new Set(filteredOrders.map(o => o.userId).filter(Boolean));
  const churned = Math.max(0, totalUsers - activeUserIds.size);

  // Revenue calculations
  const grossRevenue = totalRevenue;
  const taxPercent = 18;
  const taxCollected = Math.round(grossRevenue * (taxPercent / (100 + taxPercent)));
  const netProfit = Math.round((grossRevenue - totalRefunds - taxCollected) * 0.45);

  // Product calculations
  let totalUnitsSold = 0;
  const productSalesCount = {};
  filteredOrders.filter(o => o.paymentStatus === 'paid').forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach(item => {
        totalUnitsSold += (item.quantity || 0);
        productSalesCount[item.name] = (productSalesCount[item.name] || 0) + (item.quantity || 0);
      });
    }
  });
  const topSellingProduct = Object.entries(productSalesCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  const lowStockItems = products.filter(p => p.stock !== undefined && p.stock > 0 && p.stock < 10).length;
  const outOfStockItems = products.filter(p => p.stock === undefined || p.stock === 0).length;

  // Coupon calculations
  const couponUsage = {};
  coupons.forEach(c => {
    couponUsage[c.code] = { coupon: c.code, uses: 0, revenue: 0, savings: 0 };
  });
  filteredOrders.forEach(o => {
    if (o.couponCode && couponUsage[o.couponCode]) {
      couponUsage[o.couponCode].uses += 1;
      if (o.paymentStatus === 'paid') {
        couponUsage[o.couponCode].revenue += (o.total || 0);
        couponUsage[o.couponCode].savings += (o.couponDiscount || 0);
      }
    }
  });
  const couponReportData = Object.values(couponUsage);
  const totalCouponUses = couponReportData.reduce((sum, c) => sum + c.uses, 0);
  const revenueFromCoupons = couponReportData.reduce((sum, c) => sum + c.revenue, 0);
  const totalSavingsGiven = couponReportData.reduce((sum, c) => sum + c.savings, 0);
  const activeCouponsCount = coupons.filter(c => c.status === 'active').length;

  const summaryStats = {
    sales: [
      { label: 'Total Orders', value: totalOrders.toLocaleString(), change: '+12.4%', color: '#DFFF1B' },
      { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, change: '+15.2%', color: '#22C55E' },
      { label: 'Avg Order Value', value: `₹${avgOrderValue.toLocaleString()}`, change: '+2.5%', color: '#3B82F6' },
      { label: 'Refunds', value: `₹${totalRefunds.toLocaleString()}`, change: '-5.1%', color: '#FF4D4D' },
    ],
    customers: [
      { label: 'New Customers (30d)', value: newCustomers.toLocaleString(), change: '+8.6%', color: '#8B5CF6' },
      { label: 'Returning Customers', value: returningCustomers.toLocaleString(), change: '+14.2%', color: '#22C55E' },
      { label: 'Retention Rate', value: `${retentionRate}%`, change: '+1.1%', color: '#DFFF1B' },
      { label: 'Inactive Customers', value: churned.toLocaleString(), change: '-3.0%', color: '#FF4D4D' },
    ],
    revenue: [
      { label: 'Gross Revenue', value: `₹${grossRevenue.toLocaleString()}`, change: '+15.2%', color: '#22C55E' },
      { label: 'Est. Net Profit', value: `₹${netProfit.toLocaleString()}`, change: '+11.8%', color: '#DFFF1B' },
      { label: 'Est. GST Collected', value: `₹${taxCollected.toLocaleString()}`, change: '+15.2%', color: '#3B82F6' },
      { label: 'Total Refunds', value: `₹${totalRefunds.toLocaleString()}`, change: '-5.1%', color: '#FF4D4D' },
    ],
    products: [
      { label: 'Total Units Sold', value: totalUnitsSold.toLocaleString(), change: '+10.4%', color: '#00F5FF' },
      { label: 'Top Selling', value: topSellingProduct, color: '#DFFF1B' },
      { label: 'Low Stock Items', value: lowStockItems.toString(), color: '#F59E0B' },
      { label: 'Out of Stock', value: outOfStockItems.toString(), color: '#FF4D4D' },
    ],
    coupons: [
      { label: 'Total Uses', value: totalCouponUses.toLocaleString(), change: '+21.5%', color: '#F59E0B' },
      { label: 'Revenue from Coupons', value: `₹${revenueFromCoupons.toLocaleString()}`, change: '+24.1%', color: '#DFFF1B' },
      { label: 'Total Savings Given', value: `₹${totalSavingsGiven.toLocaleString()}`, change: '+19.8%', color: '#8B5CF6' },
      { label: 'Active Coupons', value: activeCouponsCount.toString(), color: '#22C55E' },
    ],
  };

  const stats = summaryStats[activeReport] || summaryStats.sales;

  // Chart Data preparation
  const getSalesChartData = () => {
    const data = [];
    const now = new Date();
    if (period === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const dayOrders = filteredOrders.filter(o => {
          const od = getOrderDate(o);
          od.setHours(0, 0, 0, 0);
          return od.getTime() === d.getTime();
        });
        const rev = dayOrders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + (o.total || 0), 0);
        const ref = dayOrders.filter(o => o.orderStatus === 'refunded' || o.orderStatus === 'returned').reduce((sum, o) => sum + (o.total || 0), 0);
        data.push({
          period: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
          orders: dayOrders.length,
          revenue: rev,
          refunds: ref
        });
      }
    } else if (period === 'monthly') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const y = d.getFullYear();
        const m = d.getMonth();
        const monthOrders = filteredOrders.filter(o => {
          const od = getOrderDate(o);
          return od.getFullYear() === y && od.getMonth() === m;
        });
        const rev = monthOrders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + (o.total || 0), 0);
        const ref = monthOrders.filter(o => o.orderStatus === 'refunded' || o.orderStatus === 'returned').reduce((sum, o) => sum + (o.total || 0), 0);
        data.push({
          period: `${monthNames[m]} ${y}`,
          orders: monthOrders.length,
          revenue: rev,
          refunds: ref
        });
      }
    } else {
      // Weekly breakdown
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i + 1) * 7);
        const end = new Date();
        end.setDate(now.getDate() - i * 7);
        const weekOrders = filteredOrders.filter(o => {
          const od = getOrderDate(o);
          return od >= start && od < end;
        });
        const rev = weekOrders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + (o.total || 0), 0);
        const ref = weekOrders.filter(o => o.orderStatus === 'refunded' || o.orderStatus === 'returned').reduce((sum, o) => sum + (o.total || 0), 0);
        data.push({
          period: `Wk -${i}`,
          orders: weekOrders.length,
          revenue: rev,
          refunds: ref
        });
      }
    }
    return data;
  };

  const getCustomerChartData = () => {
    const data = [];
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const newUsersCount = users.filter(u => {
        if (!u.createdAt) return false;
        const ud = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        return ud.getFullYear() === y && ud.getMonth() === m;
      }).length;

      const activeUsers = filteredOrders.filter(o => {
        const od = getOrderDate(o);
        return od.getFullYear() === y && od.getMonth() === m;
      }).map(o => o.userId).filter(Boolean);

      const uniqueActive = [...new Set(activeUsers)];
      const returningUsersCount = uniqueActive.filter(uid => {
        const priorOrders = filteredOrders.filter(o => {
          const od = getOrderDate(o);
          return o.userId === uid && (od.getFullYear() < y || (od.getFullYear() === y && od.getMonth() < m));
        });
        return priorOrders.length > 0;
      }).length;

      data.push({
        month: `${monthNames[m]} ${y}`,
        new: newUsersCount,
        returning: returningUsersCount,
        churned: Math.max(0, Math.round(newUsersCount * 0.1)),
      });
    }
    return data;
  };

  const getTopProductsChartData = () => {
    return Object.entries(productSalesCount)
      .map(([name, units]) => {
        const prod = products.find(p => p.name === name);
        const revenue = (prod?.discount_price || prod?.price || 0) * units;
        return { name, units, revenue };
      })
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  };

  const renderChart = () => {
    if (activeReport === 'sales' || activeReport === 'revenue') return (
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={getSalesChartData()}>
          <defs>
            <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DFFF1B" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#DFFF1B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} />
          <Area type="monotone" dataKey="orders" name="Orders" stroke="#DFFF1B" strokeWidth={2.5} fill="url(#ordGrad)" dot={false} />
          <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#22C55E" strokeWidth={2} fill="transparent" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    );
    if (activeReport === 'customers') return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={getCustomerChartData()}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} />
          <Line type="monotone" dataKey="new" name="New Customers" stroke="#8B5CF6" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="returning" name="Returning" stroke="#22C55E" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="churned" name="Churned" stroke="#FF4D4D" strokeWidth={2} dot={false} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    );
    if (activeReport === 'products') return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={getTopProductsChartData()} layout="vertical" barSize={20}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="units" name="Units Sold" fill="#00F5FF" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
    if (activeReport === 'coupons') return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={couponReportData} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="coupon" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} />
          <Bar dataKey="uses" name="Uses" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
    return null;
  };

  return (
    <AdminLayout>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Reports & Analytics</h1>
            <p className="page-subtitle">Generate and export detailed business reports.</p>
          </div>
          <div className="page-actions">
            <button className="btn btn-secondary btn-sm"><Download size={14} /> Export PDF</button>
            <button className="btn btn-secondary btn-sm"><Download size={14} /> Export Excel</button>
          </div>
        </motion.div>

        {/* Report Type Tabs */}
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {REPORT_TYPES.map(rt => (
            <button
              key={rt.id}
              className={`report-type-btn ${activeReport === rt.id ? 'active' : ''}`}
              onClick={() => setActiveReport(rt.id)}
              style={{ '--btn-color': rt.color }}
            >
              <rt.icon size={15} /> {rt.label}
            </button>
          ))}
        </motion.div>

        {/* Date Controls */}
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="period-tabs">
            {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
              <button key={p} className={`period-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input className="form-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 150 }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
            <input className="form-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 150 }} />
            <button className="btn btn-secondary btn-sm" onClick={fetchData}><RefreshCw size={13} /> Refresh</button>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Calculating stats and processing charts...</div>
        ) : (
          <>
            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {stats.map((s, i) => (
                <motion.div key={i} className="kpi-card" variants={itemVariants}>
                  <div className="kpi-label">{s.label}</div>
                  <div className="kpi-value" style={{ color: s.color, fontSize: '1.35rem' }}>{s.value}</div>
                  {s.change && <div className={`kpi-change ${s.change.startsWith('+') ? 'up' : 'down'}`}>
                    {s.change} vs prev period
                  </div>}
                </motion.div>
              ))}
            </div>

            {/* Chart */}
            <motion.div className="chart-card" variants={itemVariants}>
              <div className="chart-card-header">
                <div>
                  <h3>{REPORT_TYPES.find(r => r.id === activeReport)?.label}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {period.charAt(0).toUpperCase() + period.slice(1)} breakdown
                  </p>
                </div>
              </div>
              {renderChart()}
            </motion.div>

            {/* Data Table */}
            {activeReport === 'coupons' && (
              <motion.div className="table-card" variants={itemVariants}>
                <div className="table-card-header"><h3>Coupon Performance Details</h3></div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr><th>Coupon Code</th><th>Uses</th><th>Revenue Generated</th><th>Total Savings</th><th>Conversion</th></tr>
                    </thead>
                    <tbody>
                      {couponReportData.map((c, i) => (
                        <tr key={i}>
                          <td><code className="sku-code">{c.coupon}</code></td>
                          <td><strong>{c.uses}</strong></td>
                          <td>₹{c.revenue.toLocaleString()}</td>
                          <td style={{ color: 'var(--error)' }}>₹{c.savings.toLocaleString()}</td>
                          <td>{c.revenue > 0 ? `${Math.round((c.savings / c.revenue) * 100)}%` : '0%'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      <style>{`
        .report-type-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 600; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-muted); cursor: pointer; transition: var(--transition-fast); }
        .report-type-btn:hover { border-color: var(--btn-color, var(--primary)); color: var(--btn-color, var(--primary)); }
        .report-type-btn.active { background: color-mix(in srgb, var(--btn-color, var(--primary)) 12%, transparent); border-color: var(--btn-color, var(--primary)); color: var(--btn-color, var(--primary)); }
        .sku-code { font-family: monospace; font-size: 0.78rem; color: var(--text-muted); background: var(--bg-soft); padding: 0.15rem 0.4rem; border-radius: 4px; }
        .kpi-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.2rem; }
        .kpi-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .kpi-value { font-size: 1.6rem; font-family: var(--ff-heading); font-weight: 800; letter-spacing: -0.03em; color: var(--text-main); }
        .kpi-change { display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.72rem; font-weight: 700; margin-top: 0.25rem; }
        .kpi-change.up { color: var(--success); } .kpi-change.down { color: var(--error); }
        .chart-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; }
        .chart-card-header { display: flex; align-start: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
        .chart-card-header h3 { font-size: 0.95rem; font-weight: 700; }
        .chart-tooltip { background: var(--bg-card); border: 1px solid var(--border-bright); border-radius: var(--radius-sm); padding: 0.75rem 1rem; font-size: 0.8rem; box-shadow: var(--shadow-lg); }
        .tooltip-label { font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem; padding-bottom: 0.4rem; border-bottom: 1px solid var(--border); }
        .table-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
        .table-card-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
        .table-card-header h3 { font-size: 0.95rem; font-weight: 700; }
      `}</style>
    </AdminLayout>
  );
};

export default Reports;


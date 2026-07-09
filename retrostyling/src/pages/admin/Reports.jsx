import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  FileText, Download, Calendar, TrendingUp, Users, Package,
  CreditCard, Percent, Filter, ChevronDown, BarChart2, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Report', icon: TrendingUp, color: '#DFFF1B' },
  { id: 'customers', label: 'Customer Report', icon: Users, color: '#8B5CF6' },
  { id: 'products', label: 'Product Report', icon: Package, color: '#00F5FF' },
  { id: 'revenue', label: 'Revenue Report', icon: CreditCard, color: '#22C55E' },
  { id: 'coupons', label: 'Coupon Report', icon: Percent, color: '#F59E0B' },
];

const salesChartData = [
  { period: 'Week 1', orders: 142, revenue: 89400, refunds: 3200 },
  { period: 'Week 2', orders: 186, revenue: 112000, refunds: 5800 },
  { period: 'Week 3', orders: 165, revenue: 98200, refunds: 2100 },
  { period: 'Week 4', orders: 221, revenue: 143600, refunds: 6400 },
];

const topProductsData = [
  { name: 'Leather Jacket', units: 214, revenue: 534360 },
  { name: 'Denim Jeans', units: 186, revenue: 279000 },
  { name: 'Sneakers', units: 162, revenue: 243000 },
  { name: 'Polo Shirt', units: 148, revenue: 133200 },
  { name: 'Summer Dress', units: 134, revenue: 201000 },
];

const customerData = [
  { month: 'Jan', new: 120, returning: 80, churned: 12 },
  { month: 'Feb', new: 160, returning: 110, churned: 18 },
  { month: 'Mar', new: 145, returning: 130, churned: 15 },
  { month: 'Apr', new: 200, returning: 160, churned: 22 },
  { month: 'May', new: 185, returning: 195, churned: 19 },
  { month: 'Jun', new: 230, returning: 220, churned: 24 },
  { month: 'Jul', new: 260, returning: 248, churned: 21 },
];

const couponData = [
  { coupon: 'RETRO20', uses: 47, revenue: 182000, savings: 36400 },
  { coupon: 'FLAT200', uses: 12, revenue: 48000, savings: 2400 },
  { coupon: 'FREESHIP', uses: 88, revenue: 52800, savings: 8712 },
  { coupon: 'VIP50', uses: 3, revenue: 31500, savings: 31500 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: '0.8rem' }}>{p.name}: <strong>{typeof p.value === 'number' && p.value > 999 ? `₹${p.value.toLocaleString()}` : p.value}</strong></p>
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

  const summaryStats = {
    sales: [
      { label: 'Total Orders', value: '714', change: '+18.2%', color: '#DFFF1B' },
      { label: 'Total Revenue', value: '₹4,43,200', change: '+24.3%', color: '#22C55E' },
      { label: 'Avg Order Value', value: '₹620', change: '+5.1%', color: '#3B82F6' },
      { label: 'Refunds', value: '₹17,500', change: '-8.4%', color: '#FF4D4D' },
    ],
    customers: [
      { label: 'New Customers', value: '1,300', change: '+22.1%', color: '#8B5CF6' },
      { label: 'Returning', value: '1,143', change: '+31.4%', color: '#22C55E' },
      { label: 'Retention Rate', value: '46.8%', change: '+3.2%', color: '#DFFF1B' },
      { label: 'Churned', value: '131', change: '-12.0%', color: '#FF4D4D' },
    ],
    revenue: [
      { label: 'Gross Revenue', value: '₹4,43,200', change: '+24.3%', color: '#22C55E' },
      { label: 'Net Profit', value: '₹1,86,144', change: '+19.8%', color: '#DFFF1B' },
      { label: 'Tax Collected', value: '₹39,888', change: '+24.3%', color: '#3B82F6' },
      { label: 'Total Refunds', value: '₹17,500', change: '-8.4%', color: '#FF4D4D' },
    ],
    products: [
      { label: 'Total Units Sold', value: '3,248', change: '+15.6%', color: '#00F5FF' },
      { label: 'Top Selling', value: 'Leather Jacket', color: '#DFFF1B' },
      { label: 'Low Stock Items', value: '3', change: '-50%', color: '#F59E0B' },
      { label: 'Out of Stock', value: '1', change: '0%', color: '#FF4D4D' },
    ],
    coupons: [
      { label: 'Total Uses', value: '150', change: '+32.1%', color: '#F59E0B' },
      { label: 'Revenue from Coupons', value: '₹3,14,300', change: '+41.2%', color: '#DFFF1B' },
      { label: 'Total Savings Given', value: '₹79,012', change: '+38.5%', color: '#8B5CF6' },
      { label: 'Active Coupons', value: '4', color: '#22C55E' },
    ],
  };

  const stats = summaryStats[activeReport] || summaryStats.sales;

  const renderChart = () => {
    if (activeReport === 'sales') return (
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={salesChartData}>
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
        <LineChart data={customerData}>
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
        <BarChart data={topProductsData} layout="vertical" barSize={20}>
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
        <BarChart data={couponData} barSize={28}>
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
            <button className="btn btn-secondary btn-sm"><RefreshCw size={13} /> Apply</button>
          </div>
        </motion.div>

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
                  {couponData.map((c, i) => (
                    <tr key={i}>
                      <td><code className="sku-code">{c.coupon}</code></td>
                      <td><strong>{c.uses}</strong></td>
                      <td>₹{c.revenue.toLocaleString()}</td>
                      <td style={{ color: 'var(--error)' }}>₹{c.savings.toLocaleString()}</td>
                      <td>{Math.round((c.savings / c.revenue) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
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
        .chart-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
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

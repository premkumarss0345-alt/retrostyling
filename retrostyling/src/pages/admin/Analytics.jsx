import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  BarChart2, TrendingUp, Users, ShoppingCart, Eye,
  ArrowUpRight, ArrowDownRight, RefreshCw, Filter,
  Globe, Smartphone, Monitor, MapPin, Clock
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const conversionData = [
  { date: 'Mon', visitors: 1420, sessions: 1860, conversions: 68 },
  { date: 'Tue', visitors: 1280, sessions: 1640, conversions: 52 },
  { date: 'Wed', visitors: 1860, sessions: 2340, conversions: 89 },
  { date: 'Thu', visitors: 1540, sessions: 1960, conversions: 74 },
  { date: 'Fri', visitors: 2100, sessions: 2680, conversions: 112 },
  { date: 'Sat', visitors: 2840, sessions: 3620, conversions: 148 },
  { date: 'Sun', visitors: 2460, sessions: 3140, conversions: 126 },
];

const deviceData = [
  { name: 'Mobile', value: 62, color: '#DFFF1B' },
  { name: 'Desktop', value: 30, color: '#8B5CF6' },
  { name: 'Tablet', value: 8, color: '#00F5FF' },
];

const topPages = [
  { page: '/shop', views: 8420, bounce: '42%', avg: '2m 34s' },
  { page: '/', views: 6840, bounce: '38%', avg: '1m 52s' },
  { page: '/product/leather-jacket', views: 4210, bounce: '28%', avg: '3m 12s' },
  { page: '/category/clothing', views: 3680, bounce: '45%', avg: '1m 48s' },
  { page: '/cart', views: 2940, bounce: '22%', avg: '4m 06s' },
];

const retentionData = [
  { cohort: 'Week 1', w1: 100, w2: 64, w3: 48, w4: 38 },
  { cohort: 'Week 2', w1: 100, w2: 58, w3: 44, w4: 36 },
  { cohort: 'Week 3', w1: 100, w2: 61, w3: 46, w4: 0 },
  { cohort: 'Week 4', w1: 100, w2: 67, w3: 0, w4: 0 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontSize: '0.8rem' }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const Analytics = () => {
  const [period, setPeriod] = useState('7d');

  const metrics = [
    { label: 'Total Visitors', value: '13,500', change: 18.4, icon: Eye, color: '#DFFF1B' },
    { label: 'Sessions', value: '17,240', change: 22.1, icon: Globe, color: '#3B82F6' },
    { label: 'Conversions', value: '669', change: 12.8, icon: ShoppingCart, color: '#22C55E' },
    { label: 'Conv. Rate', value: '3.88%', change: -0.4, icon: TrendingUp, color: '#8B5CF6' },
    { label: 'Avg. Order Value', value: '₹620', change: 5.1, icon: ShoppingCart, color: '#00F5FF' },
    { label: 'Returning Users', value: '41.2%', change: 3.8, icon: Users, color: '#F59E0B' },
  ];

  return (
    <AdminLayout>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Deep insights into visitor behavior, sales performance, and customer retention.</p>
          </div>
          <div className="page-actions">
            <div className="period-tabs">
              {['7d', '30d', '90d', '1y'].map(p => (
                <button key={p} className={`period-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm"><RefreshCw size={14} /> Refresh</button>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {metrics.map((m, i) => (
            <motion.div key={i} className="kpi-card" variants={itemVariants}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div className="kpi-icon-wrap" style={{ background: m.color + '18', color: m.color }}>
                  <m.icon size={18} />
                </div>
                <div>
                  <div className="kpi-label">{m.label}</div>
                  <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{m.value}</div>
                </div>
                <div className={`kpi-change ${m.change >= 0 ? 'up' : 'down'}`} style={{ marginLeft: 'auto', marginTop: 0 }}>
                  {m.change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(m.change)}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Visitor + Conversion Chart */}
        <motion.div className="chart-card" variants={itemVariants}>
          <div className="chart-card-header">
            <div>
              <h3>Visitor & Conversion Analytics</h3>
              <p>Daily visitors, sessions, and conversions</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={conversionData}>
              <defs>
                <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DFFF1B" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#DFFF1B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#DFFF1B" strokeWidth={2.5} fill="url(#visGrad)" dot={false} />
              <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#8B5CF6" strokeWidth={2} fill="url(#sesGrad)" dot={false} />
              <Line type="monotone" dataKey="conversions" name="Conversions" stroke="#22C55E" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Device + Top Pages */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          {/* Device Breakdown */}
          <motion.div className="chart-card" variants={itemVariants}>
            <div className="chart-card-header"><div><h3>Device Breakdown</h3></div></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                    {deviceData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} contentStyle={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                {deviceData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    {d.name === 'Mobile' ? <Smartphone size={13} /> : d.name === 'Desktop' ? <Monitor size={13} /> : null}
                    <span style={{ flex: 1 }}>{d.name}</span>
                    <strong>{d.value}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Top Pages */}
          <motion.div className="chart-card" variants={itemVariants}>
            <div className="chart-card-header"><div><h3>Top Pages</h3><p>Most visited pages this period</p></div></div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>Page</th><th>Views</th><th>Bounce Rate</th><th>Avg. Time</th></tr>
                </thead>
                <tbody>
                  {topPages.map((p, i) => (
                    <tr key={i}>
                      <td><code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)' }}>{p.page}</code></td>
                      <td><strong>{p.views.toLocaleString()}</strong></td>
                      <td><span style={{ color: parseFloat(p.bounce) > 40 ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>{p.bounce}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}><Clock size={11} style={{ display: 'inline', marginRight: 4 }} />{p.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Retention Heatmap */}
        <motion.div className="chart-card" variants={itemVariants}>
          <div className="chart-card-header"><div><h3>Customer Retention Cohorts</h3><p>% of customers returning each week</p></div></div>
          <div className="retention-grid">
            <div className="retention-header">
              <span>Cohort</span><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
            </div>
            {retentionData.map(row => (
              <div key={row.cohort} className="retention-row">
                <span className="retention-cohort">{row.cohort}</span>
                {[row.w1, row.w2, row.w3, row.w4].map((val, i) => (
                  <div key={i} className="retention-cell" style={{ background: val === 0 ? 'transparent' : `rgba(223,255,27,${val / 100 * 0.7 + 0.1})`, color: val > 50 ? 'var(--black)' : 'var(--text-main)' }}>
                    {val > 0 ? `${val}%` : '—'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .kpi-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; transition: var(--transition); }
        .kpi-card:hover { border-color: var(--border-bright); }
        .kpi-icon-wrap { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kpi-label { font-size: 0.72rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .kpi-value { font-size: 1.35rem; font-family: var(--ff-heading); font-weight: 800; letter-spacing: -0.02em; }
        .kpi-change { display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.72rem; font-weight: 700; }
        .kpi-change.up { color: var(--success); } .kpi-change.down { color: var(--error); }
        .chart-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; }
        .chart-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
        .chart-card-header h3 { font-size: 0.95rem; font-weight: 700; }
        .chart-card-header p { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.1rem; }
        .chart-tooltip { background: var(--bg-card); border: 1px solid var(--border-bright); border-radius: var(--radius-sm); padding: 0.75rem 1rem; }
        .tooltip-label { font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem; padding-bottom: 0.4rem; border-bottom: 1px solid var(--border); }
        .retention-grid { display: flex; flex-direction: column; gap: 0.5rem; }
        .retention-header { display: grid; grid-template-columns: 80px repeat(4, 1fr); gap: 0.5rem; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
        .retention-row { display: grid; grid-template-columns: 80px repeat(4, 1fr); gap: 0.5rem; align-items: center; }
        .retention-cohort { font-size: 0.8rem; color: var(--text-dim); font-weight: 600; }
        .retention-cell { height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; transition: var(--transition-fast); }
      `}</style>
    </AdminLayout>
  );
};

export default Analytics;

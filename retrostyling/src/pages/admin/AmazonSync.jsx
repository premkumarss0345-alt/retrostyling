import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { amazonSyncService } from '../../services/firestoreService';
import {
  RefreshCw, CheckCircle2, XCircle, AlertCircle, Zap,
  ShoppingBag, Clock, Package, Info, ExternalLink, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SETUP_STEPS = [
  {
    num: 1,
    title: 'Register as Amazon Developer',
    desc: 'Log in to Seller Central → Apps & Services → Develop Apps → Add New App Client.',
    link: 'https://sellercentral.amazon.in/apps/manage',
    linkText: 'Open Seller Central',
  },
  {
    num: 2,
    title: 'Request SP-API Access',
    desc: 'In your Developer profile, apply for "Selling Partner API" access. Amazon reviews this in 1–3 business days.',
    link: 'https://developer.amazonservices.in/',
    linkText: 'SP-API Portal',
  },
  {
    num: 3,
    title: 'Authorize Your App (LWA OAuth)',
    desc: 'Once approved, go to Seller Central → Apps & Services → Authorize a Developer App. This generates your refresh_token.',
    link: 'https://developer-docs.amazon.com/sp-api/docs/self-authorization',
    linkText: 'LWA Docs',
  },
  {
    num: 4,
    title: 'Fill .env Credentials',
    desc: 'Copy your client_id, client_secret, seller_id, and refresh_token into the backend/.env file.',
    link: null,
  },
  {
    num: 5,
    title: 'Start the Backend Proxy',
    desc: 'Run the proxy server: cd backend && npm install && npm start. The proxy runs on port 3001.',
    link: null,
    code: 'cd backend && npm install && npm start',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const AmazonSync = () => {
  const [status, setStatus] = useState(null);       // null | object
  const [statusError, setStatusError] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    checkStatus();
    loadLastSync();
  }, []);

  const checkStatus = async () => {
    setCheckingStatus(true);
    setStatusError(null);
    try {
      const s = await amazonSyncService.getStatus();
      setStatus(s);
    } catch (err) {
      setStatusError(err.message);
      setStatus(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  const loadLastSync = async () => {
    try {
      const info = await amazonSyncService.getLastSyncInfo();
      setLastSync(info);
    } catch {}
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await amazonSyncService.triggerSync();
      setSyncResult({ success: true, count: res.syncedCount });
      loadLastSync();
      checkStatus();
    } catch (err) {
      setSyncResult({ success: false, error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatTs = (ts) => {
    if (!ts) return 'Never';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const isConnected = status?.connected;

  return (
    <AdminLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        {/* Page Header */}
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{
                background: 'linear-gradient(135deg, #FF9900, #FFB347)',
                borderRadius: '8px', padding: '6px 10px',
                fontSize: '1.1rem', fontWeight: 800, color: '#000'
              }}>amazon</span>
              SP-API Integration
            </h1>
            <p className="page-subtitle">Sync orders from Amazon Seller Central into your RetroStylings dashboard.</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={checkStatus}
            disabled={checkingStatus}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={checkingStatus ? 'spinning' : ''} />
            {checkingStatus ? 'Checking...' : 'Check Status'}
          </button>
        </motion.div>

        {/* Connection Status Card */}
        <motion.div variants={itemVariants} className="inv-stat-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: isConnected ? 'rgba(34,197,94,0.1)' : 'rgba(255,77,77,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${isConnected ? 'rgba(34,197,94,0.3)' : 'rgba(255,77,77,0.3)'}`,
              }}>
                {checkingStatus
                  ? <RefreshCw size={22} color="var(--text-muted)" className="spinning" />
                  : isConnected
                    ? <CheckCircle2 size={22} color="#4ADE80" />
                    : <XCircle size={22} color="#F87171" />
                }
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--white)', fontWeight: 700 }}>
                  {checkingStatus ? 'Checking connection...' : isConnected ? 'Amazon Connected' : 'Not Connected'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {isConnected
                    ? `Marketplace: ${status.marketplaceId} · Seller: ${status.sellerId}`
                    : statusError || 'Backend proxy not reachable. Make sure it\'s running on port 3001.'}
                </p>
              </div>
            </div>

            {isConnected && (
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Sync</p>
                  <p style={{ margin: '4px 0 0', fontSize: '1rem', color: 'var(--white)', fontWeight: 600 }}>
                    {lastSync?.lastSyncAt ? formatTs(lastSync.lastSyncAt) : 'Never'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders Synced</p>
                  <p style={{ margin: '4px 0 0', fontSize: '1rem', color: 'var(--white)', fontWeight: 600 }}>
                    {lastSync?.lastOrderCount ?? '—'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {isConnected && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={handleSync}
                disabled={syncing}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Zap size={15} />
                {syncing ? 'Syncing...' : 'Sync Now (Last 7 Days)'}
              </button>
              <p style={{ margin: 'auto 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Auto-sync runs every 15 minutes in the background.
              </p>
            </div>
          )}

          <AnimatePresence>
            {syncResult && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: syncResult.success ? 'rgba(34,197,94,0.08)' : 'rgba(255,77,77,0.08)',
                  border: `1px solid ${syncResult.success ? 'rgba(34,197,94,0.25)' : 'rgba(255,77,77,0.25)'}`,
                  color: syncResult.success ? '#4ADE80' : '#F87171',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
                }}
              >
                {syncResult.success
                  ? <><CheckCircle2 size={16} /> Successfully synced {syncResult.count} Amazon order{syncResult.count !== 1 ? 's' : ''}!</>
                  : <><XCircle size={16} /> Sync failed: {syncResult.error}</>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Setup Guide */}
        <motion.div variants={itemVariants}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--white)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} color="#F59E0B" /> Setup Guide
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {SETUP_STEPS.map((step) => (
              <motion.div
                key={step.num}
                variants={itemVariants}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(255,153,0,0.15)',
                  border: `2px solid ${isConnected ? 'rgba(34,197,94,0.4)' : 'rgba(255,153,0,0.4)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 800,
                  color: isConnected ? '#4ADE80' : '#FF9900',
                }}>
                  {isConnected ? <CheckCircle2 size={16} /> : step.num}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', color: 'var(--white)', fontWeight: 600 }}>
                    {step.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.55 }}>
                    {step.desc}
                  </p>
                  {step.code && (
                    <div style={{
                      marginTop: '0.75rem',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '6px',
                      padding: '0.6rem 0.9rem',
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      color: '#DFFF1B',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <code>{step.code}</code>
                      <button
                        onClick={() => copyToClipboard(step.code, step.num)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === step.num ? '#4ADE80' : 'var(--text-muted)', padding: '0 0 0 0.5rem' }}
                        title="Copy"
                      >
                        {copied === step.num ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        marginTop: '0.6rem', fontSize: '0.8rem',
                        color: '#FF9900', textDecoration: 'none', fontWeight: 500,
                      }}
                    >
                      {step.linkText} <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* .env Reference */}
        <motion.div variants={itemVariants} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--white)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={16} color="var(--primary)" /> backend/.env Reference
          </h3>
          <pre style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem',
            fontSize: '0.82rem', color: '#DFFF1B', overflowX: 'auto', margin: 0,
            border: '1px solid rgba(223,255,27,0.1)',
          }}>
{`AMAZON_CLIENT_ID=amzn1.application-oa2-client.xxx
AMAZON_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AMAZON_REFRESH_TOKEN=Atzr|xxxxxxxxxxxxxxxxxxxxxxxx
AMAZON_MARKETPLACE_ID=A21TJRUUN4KGV
AMAZON_SELLER_ID=XXXXXXXXXXXXXX
PORT=3001
FRONTEND_URL=http://localhost:5173`}
          </pre>
          <button
            onClick={() => copyToClipboard(`AMAZON_CLIENT_ID=amzn1.application-oa2-client.xxx\nAMAZON_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nAMAZON_REFRESH_TOKEN=Atzr|xxxxxxxxxxxxxxxxxxxxxxxx\nAMAZON_MARKETPLACE_ID=A21TJRUUN4KGV\nAMAZON_SELLER_ID=XXXXXXXXXXXXXX\nPORT=3001\nFRONTEND_URL=http://localhost:5173`, 'env')}
            style={{
              marginTop: '0.75rem', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: '6px',
              padding: '0.4rem 0.9rem', color: 'var(--text-light)',
              cursor: 'pointer', fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            {copied === 'env' ? <><CheckCircle2 size={14} color="#4ADE80" /> Copied!</> : <><Copy size={14} /> Copy Template</>}
          </button>
        </motion.div>

      </motion.div>

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
};

export default AmazonSync;

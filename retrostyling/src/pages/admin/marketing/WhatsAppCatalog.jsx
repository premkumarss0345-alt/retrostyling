import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout';
import Toast from '../../../components/Toast';
import { marketingSettingsService } from '../../../services/firestoreService';
import { MessageSquare, Phone, Link as LinkIcon, Save, Check, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

const WhatsAppCatalog = () => {
  const [settings, setSettings] = useState({
    whatsappNumber: '',
    catalogUrl: '',
    enabledGlobalButton: true,
    greetingMessage: 'Hello! I am interested in your products at Retrostylings.'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await marketingSettingsService.get();
      setSettings({
        whatsappNumber: data.whatsappNumber || '+91 9751514541',
        catalogUrl: data.catalogUrl || 'https://wa.me/c/919751514541',
        enabledGlobalButton: data.enabledGlobalButton !== undefined ? Boolean(data.enabledGlobalButton) : true,
        greetingMessage: data.greetingMessage || 'Hello! I am interested in your products at Retrostylings.'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const showMsg = (msg, type = 'success') => {
    setToast({ text: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await marketingSettingsService.update(settings);
      showMsg('WhatsApp catalog settings saved successfully!');
    } catch (err) {
      console.error(err);
      showMsg('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cleanPhone = settings.whatsappNumber.replace(/[^\d+]/g, '');
  const testWhatsAppUrl = settings.catalogUrl || (cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(settings.greetingMessage)}` : '#');

  return (
    <AdminLayout>
      {toast && <Toast isOpen={true} message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
      
      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <motion.div className="page-header" variants={itemVariants}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(37,211,102,0.2), rgba(18,140,126,0.3))',
              border: '1px solid rgba(37,211,102,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#25D366'
            }}>
              <MessageSquare size={26} />
            </div>
            <div>
              <h1 className="page-title">WhatsApp Catalog & Business Integration</h1>
              <p className="page-subtitle">Configure your WhatsApp Business catalog link and floating store contact widget.</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ padding: '2rem 0', color: 'var(--text-muted)' }}>Loading WhatsApp catalog settings...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem' }}>
            
            {/* Form Section */}
            <motion.div variants={itemVariants} className="newsletter-form" style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <Sparkles size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Integration Settings</h3>
              </div>

              <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={14} color="#25D366" /> WhatsApp Business Phone Number *
                  </label>
                  <input
                    name="whatsappNumber"
                    value={settings.whatsappNumber}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g. +91 98765 43210"
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                    Include country code (e.g., +91 for India, +1 for US).
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <LinkIcon size={14} color="var(--primary)" /> WhatsApp Catalog Link URL *
                  </label>
                  <input
                    name="catalogUrl"
                    value={settings.catalogUrl}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://wa.me/c/919876543210"
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                    Copy your catalog link from your WhatsApp Business mobile app under Settings &gt; Business Tools &gt; Catalog.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Customer Greeting Message</label>
                  <textarea
                    name="greetingMessage"
                    value={settings.greetingMessage}
                    onChange={handleChange}
                    className="form-input"
                    rows={3}
                    placeholder="E.g. Hi RetroStylings team! I'm interested in ordering..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-soft)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>Enable Global WhatsApp Button</h4>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Show floating WhatsApp Catalog & Support button across all customer pages.</p>
                  </div>
                  <input
                    name="enabledGlobalButton"
                    type="checkbox"
                    checked={settings.enabledGlobalButton}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#25D366' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', color: '#000', fontWeight: 700, border: 'none' }}>
                    {saving ? <Save size={16} className="spin" /> : <Check size={16} />} Save Integration Settings
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Live Preview Card */}
            <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Storefront Widget Preview</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>How your WhatsApp Business Catalog appears to customers on mobile & desktop.</p>

                {/* Card Mockup */}
                <div style={{
                  background: 'linear-gradient(145deg, #111e16, #0a110c)',
                  border: '1px solid rgba(37,211,102,0.3)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: '#25D366', color: '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '1.2rem'
                    }}>
                      <MessageSquare size={22} fill="#000" />
                    </div>
                    <div>
                      <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>RetroStylings Official</h4>
                      <span style={{ color: '#25D366', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ShieldCheck size={12} /> Verified Business Catalog
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #25D366', marginBottom: '1rem' }}>
                    "{settings.greetingMessage || 'Hello! I am interested in your products at Retrostylings.'}"
                  </p>

                  <a
                    href={testWhatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.75rem',
                      background: '#25D366',
                      color: '#000',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 15px rgba(37,211,102,0.3)'
                    }}
                  >
                    Browse Full WhatsApp Catalog <ExternalLink size={14} />
                  </a>
                </div>

                <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <strong>Direct Link Preview:</strong>
                    <p style={{ wordBreak: 'break-all', color: 'var(--primary)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                      {settings.catalogUrl || 'Not configured yet'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default WhatsAppCatalog;


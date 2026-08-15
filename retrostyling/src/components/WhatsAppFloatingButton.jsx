import React, { useState, useEffect } from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { marketingSettingsService } from '../services/firestoreService';

const WhatsAppFloatingButton = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    marketingSettingsService.get().then(data => {
      setSettings({
        whatsappNumber: data?.whatsappNumber || '+91 9751514541',
        catalogUrl: data?.catalogUrl || 'https://wa.me/c/919751514541',
        enabled: data?.enabledGlobalButton !== undefined ? Boolean(data.enabledGlobalButton) : true,
        greeting: data?.greetingMessage || 'Hello! I am interested in your products at Retrostylings.'
      });
    }).catch(() => {
      setSettings({
        whatsappNumber: '+91 9751514541',
        catalogUrl: 'https://wa.me/c/919751514541',
        enabled: true,
        greeting: 'Hello! I am interested in your products at Retrostylings.'
      });
    });
  }, []);

  if (!settings || !settings.enabled) return null;

  const targetUrl = settings.catalogUrl || (settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(settings.greeting)}` : '#');

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Browse WhatsApp Catalog"
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.65rem 1.1rem',
        background: 'linear-gradient(135deg, #25D366, #128C7E)',
        color: '#000',
        borderRadius: '50px',
        fontWeight: 800,
        fontSize: '0.85rem',
        textDecoration: 'none',
        boxShadow: '0 8px 25px rgba(37,211,102,0.4)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        border: '1.5px solid rgba(255,255,255,0.3)',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <MessageSquare size={20} fill="#000" />
      <span>WhatsApp Catalog</span>
    </a>
  );
};

export default WhatsAppFloatingButton;

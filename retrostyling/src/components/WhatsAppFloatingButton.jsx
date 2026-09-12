import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { marketingSettingsService } from '../services/firestoreService';
import './WhatsAppFloatingButton.css';

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
      className="whatsapp-floating-btn"
    >
      <MessageSquare size={20} fill="#000" />
      <span>WhatsApp Catalog</span>
    </a>
  );
};

export default WhatsAppFloatingButton;

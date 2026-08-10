import React, { useEffect } from 'react';

const DEFAULT_TITLE = "Retrostylings | Premium Men's Fashion & Apparel";
const DEFAULT_DESCRIPTION = "Discover retro and modern men's fashion at Retrostylings. Shop premium shirts, t-shirts, jackets, and essentials with supreme comfort and style.";
const DEFAULT_KEYWORDS = "men's fashion, vintage clothing, retro shirts, premium menswear, streetwear, casual wear, formal wear, Retrostylings";
const DEFAULT_IMAGE = "/og-image.jpg";

/**
 * Reusable SEO component for managing dynamic meta tags, titles, canonicals, 
 * Open Graph, Twitter Cards, and Schema.org JSON-LD structured data.
 */
const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  noindex = false,
  schema = null,
}) => {
  const fullTitle = title ? `${title} | Retrostylings` : DEFAULT_TITLE;
  const currentUrl = canonical
    ? (canonical.startsWith('http') ? canonical : `${window.location.origin}${canonical}`)
    : window.location.href;
  const fullOgImage = ogImage?.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`;

  useEffect(() => {
    // 1. Update Title
    document.title = fullTitle;

    // Helper to create or update meta tags
    const updateMeta = (selector, attrName, attrValue, content) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content || '');
    };

    // Helper to create or update link tags
    const updateLink = (rel, href) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    updateMeta('meta[name="description"]', 'name', 'description', description);
    updateMeta('meta[name="keywords"]', 'name', 'keywords', keywords);
    updateMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // 3. Canonical Link
    updateLink('canonical', currentUrl);

    // 4. Open Graph Meta Tags
    updateMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Retrostylings');
    updateMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    updateMeta('meta[property="og:description"]', 'property', 'og:description', description);
    updateMeta('meta[property="og:url"]', 'property', 'og:url', currentUrl);
    updateMeta('meta[property="og:image"]', 'property', 'og:image', fullOgImage);
    updateMeta('meta[property="og:type"]', 'property', 'og:type', ogType);

    // 5. Twitter Card Meta Tags
    updateMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    updateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMeta('meta[name="twitter:image"]', 'name', 'twitter:image', fullOgImage);

    // 6. JSON-LD Structured Data
    let scriptTag = document.getElementById('seo-json-ld');
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'seo-json-ld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [fullTitle, description, keywords, currentUrl, fullOgImage, ogType, noindex, schema]);

  return null;
};

export default SEO;

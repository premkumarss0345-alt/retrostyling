import React, { useEffect } from 'react';

export const SITE_URL = 'https://www.retrostylings.in';
export const SITE_NAME = 'Retrostylings';
export const DEFAULT_TITLE = "Retrostylings | Trendy Men's & Women's Fashion Online";
export const DEFAULT_DESCRIPTION = "Shop trendy men's and women's fashion at Retrostylings. Discover stylish T-shirts, tops, graphic prints and affordable apparel online in India.";
export const DEFAULT_KEYWORDS = "men's fashion, women's fashion, graphic t-shirts, trendy clothing, casual wear, online fashion shopping India, Retrostylings";
export const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

/**
 * Production-ready SEO component for managing title, meta description, 
 * canonical URLs, robots directives, Open Graph, Twitter Cards, 
 * and Schema.org JSON-LD structured data.
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
  // Format title: ensure consistent 'Page Title | Retrostylings' without duplicate suffix
  let fullTitle = DEFAULT_TITLE;
  if (title) {
    if (title.toLowerCase().includes('retrostylings') || title.toLowerCase().includes('retro stylings')) {
      fullTitle = title;
    } else {
      fullTitle = `${title} | ${SITE_NAME}`;
    }
  }

  // Canonical URL calculation:
  // Strips facet parameters (?sort=, ?page=, ?search=, ?size=) unless explicitly specified
  let cleanCanonical = SITE_URL;
  if (canonical) {
    cleanCanonical = canonical.startsWith('http')
      ? canonical
      : `${SITE_URL}${canonical.startsWith('/') ? '' : '/'}${canonical}`;
  } else if (typeof window !== 'undefined') {
    cleanCanonical = `${SITE_URL}${window.location.pathname}`;
  }

  // Ensure absolute image URL
  const fullOgImage = ogImage?.startsWith('http')
    ? ogImage
    : `${SITE_URL}${ogImage?.startsWith('/') ? '' : '/'}${ogImage || 'logo.png'}`;

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
    if (keywords) {
      updateMeta('meta[name="keywords"]', 'name', 'keywords', keywords);
    }
    updateMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // 3. Canonical Link
    updateLink('canonical', cleanCanonical);

    // 4. Open Graph Meta Tags
    updateMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    updateMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    updateMeta('meta[property="og:description"]', 'property', 'og:description', description);
    updateMeta('meta[property="og:url"]', 'property', 'og:url', cleanCanonical);
    updateMeta('meta[property="og:image"]', 'property', 'og:image', fullOgImage);
    updateMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    updateMeta('meta[property="og:locale"]', 'property', 'og:locale', 'en_IN');

    // 5. Twitter Card Meta Tags
    updateMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    updateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMeta('meta[name="twitter:image"]', 'name', 'twitter:image', fullOgImage);

    // 6. JSON-LD Structured Data
    let scriptTag = document.getElementById('seo-dynamic-json-ld');
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'seo-dynamic-json-ld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [fullTitle, description, keywords, cleanCanonical, fullOgImage, ogType, noindex, schema]);

  return null;
};

export default SEO;

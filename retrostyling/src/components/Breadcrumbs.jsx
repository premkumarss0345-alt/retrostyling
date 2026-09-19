import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumbs.css';

/**
 * Accessible Breadcrumb navigation component with Schema.org Microdata & BreadcrumbList support.
 * @param {Array<{label: string, url?: string}>} items - List of breadcrumb trail steps
 */
const Breadcrumbs = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  const SITE_URL = 'https://www.retrostylings.in';

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs-nav">
      <ol className="breadcrumbs-list" itemScope itemType="https://schema.org/BreadcrumbList">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const position = index + 1;
          const fullItemUrl = item.url
            ? (item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`)
            : null;

          return (
            <li
              key={index}
              className={`breadcrumb-item ${isLast ? 'active' : ''}`}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index === 0 && (
                <Home size={14} className="breadcrumb-home-icon" aria-hidden="true" />
              )}
              {isLast || !item.url ? (
                <span className="breadcrumb-current" itemProp="name" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.url} className="breadcrumb-link" itemProp="item">
                  <span itemProp="name">{item.label}</span>
                </Link>
              )}
              {fullItemUrl && <meta itemProp="item" content={fullItemUrl} />}
              <meta itemProp="position" content={String(position)} />

              {!isLast && (
                <ChevronRight size={13} className="breadcrumb-separator" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

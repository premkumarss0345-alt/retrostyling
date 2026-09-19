import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home, ShoppingBag, ArrowRight, Compass } from 'lucide-react';
import SEO from '../components/SEO';
import './NotFound.css';

const NotFound = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <div className="not-found-page container section">
      <SEO
        title="404 - Page Not Found"
        description="The page you are looking for does not exist or has been moved. Explore trending men's and women's fashion at Retrostylings."
        noindex={true}
      />

      <div className="not-found-card glass-card">
        <div className="not-found-badge">ERROR 404</div>
        <h1 className="not-found-title">Looks Like You’ve Wandered Off-Trend</h1>
        <p className="not-found-desc">
          The page or product you were looking for doesn't exist, was renamed, or has moved to a new collection.
        </p>

        {/* Quick Search */}
        <form className="not-found-search-form" onSubmit={handleSearch}>
          <div className="not-found-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search graphic tees, shirts, tops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search store products"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </div>
        </form>

        {/* Quick Navigation Links */}
        <div className="not-found-links-section">
          <h3>Popular Categories & Collections</h3>
          <div className="not-found-chips">
            <Link to="/shop" className="chip active">
              <ShoppingBag size={14} /> Shop All
            </Link>
            <Link to="/new-arrivals" className="chip">
              New Arrivals
            </Link>
            <Link to="/sale" className="chip">
              Sale & Offers
            </Link>
            <Link to="/best-sellers" className="chip">
              Best Sellers
            </Link>
            <Link to="/contact" className="chip">
              Contact Support
            </Link>
            <Link to="/" className="chip">
              <Home size={14} /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

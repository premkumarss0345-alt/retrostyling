import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { wishlistService, productService } from '../services/firestoreService';
import { useAuth } from '../services/AuthContext';
import './Wishlist.css';

const Wishlist = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const { currentUser }         = useAuth();

  useEffect(() => {
    if (currentUser) loadWishlist();
    else setLoading(false);
  }, [currentUser]);

  const loadWishlist = async () => {
    try {
      const ids = await wishlistService.get();
      // Fetch each product by ID
      const prodsResult = await Promise.all(
        ids.map((id) => productService.getById(id).catch(() => null))
      );
      setProducts(prodsResult.filter(Boolean));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container section center-loading">Loading wishlist...</div>;

  if (!currentUser) {
    return (
      <div className="container section empty-wishlist" style={{ textAlign: 'center' }}>
        <Heart size={80} strokeWidth={1} color="#ccc" />
        <h2>Sign in to view your wishlist</h2>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>Sign In</Link>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container section empty-wishlist" style={{ textAlign: 'center' }}>
        <Heart size={80} strokeWidth={1} color="#ccc" />
        <h2>Your wishlist is empty</h2>
        <p>Save items you love to find them later.</p>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1rem' }}>EXPLORE SHOP</Link>
      </div>
    );
  }

  return (
    <div className="wishlist-page container section">
      <h1 className="h2 title-centered">My Wishlist</h1>
      <div className="product-grid">
        {products.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;

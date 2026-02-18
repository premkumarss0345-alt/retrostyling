import React, { useState, useEffect } from 'react';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import './Wishlist.css';

const Wishlist = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch('http://localhost:5001/api/wishlist', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setWishlistItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="container section">Loading wishlist...</div>;

    if (wishlistItems.length === 0) {
        return (
            <div className="container section empty-wishlist">
                <Heart size={80} strokeWidth={1} color="#ccc" />
                <h2>Your wishlist is empty</h2>
                <p>Save items you love here to find them later.</p>
                <Link to="/shop" className="btn btn-primary">EXPLORE SHOP</Link>
            </div>
        );
    }

    return (
        <div className="wishlist-page container section">
            <h1 className="h2 title-centered">My Wishlist</h1>
            <div className="product-grid">
                {wishlistItems.map(item => (
                    <ProductCard key={item.id} product={item} />
                ))}
            </div>
        </div>
    );
};

export default Wishlist;

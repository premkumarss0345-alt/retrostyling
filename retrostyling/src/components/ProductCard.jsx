import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ShoppingBag, Heart } from 'lucide-react';
import Toast from './Toast';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const [toast, setToast] = useState({ show: false, message: '' });

    const handleAddToCart = async () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        try {
            const res = await fetch('http://localhost:5001/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: product.id,
                    quantity: 1
                })
            });
            if (res.ok) {
                setToast({ show: true, message: `${product.name} added to cart!` });
                // Optional: window.location.reload(); or use a global cart context
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddToWishlist = async () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        try {
            const res = await fetch('http://localhost:5001/api/wishlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: product.id })
            });
            if (res.ok) alert('Added to wishlist!');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="product-card">
            <figure className="card-banner">
                <a href={`/product/${product.slug}`}>
                    <img src={product.image} alt={product.name} className="w-100" />
                </a>

                {Number(product.on_sale) === 1 && <div className="card-badge red">SALE</div>}
                {Number(product.is_new) === 1 && <div className="card-badge green">New</div>}

                <div className="card-actions">
                    <button className="card-action-btn" aria-label="Quick view" onClick={() => navigate(`/product/${product.slug}`)}>
                        <Eye size={20} />
                    </button>

                    <button className="card-action-btn cart-btn" onClick={handleAddToCart}>
                        <ShoppingBag size={20} />
                        <p>Add to Cart</p>
                    </button>

                    <button className="card-action-btn" aria-label="Add to Wishlist" onClick={handleAddToWishlist}>
                        <Heart size={20} />
                    </button>
                </div>
            </figure>

            <div className="card-content">
                <h3 className="card-title">
                    <a href={`/product/${product.slug}`}>{product.name}</a>
                </h3>

                <div className="card-price">
                    {Number(product.on_sale) ? (
                        <>
                            <span className="discount-price">₹{Number(product.discount_price).toFixed(2)}</span>
                            <span className="original-price">₹{Number(product.price).toFixed(2)}</span>
                        </>
                    ) : (
                        <span className="main-price">₹{Number(product.price).toFixed(2)}</span>
                    )}
                </div>
            </div>
            <Toast
                isOpen={toast.show}
                message={toast.message}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
};

export default ProductCard;

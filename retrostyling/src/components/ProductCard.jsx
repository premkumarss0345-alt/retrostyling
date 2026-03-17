import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ShoppingBag, Heart } from 'lucide-react';
import { cartService, wishlistService } from '../services/firestoreService';
import { useAuth } from '../services/AuthContext';
import Toast from './Toast';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [loading, setLoading] = useState(false);

    const handleAddToCart = async () => {
        if (!currentUser) return navigate('/login');
        setLoading(true);

        try {
            // Add to cart using firestoreService
            // Defaulting to first variant if exists, or null
            const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
            await cartService.addItem(product, variant, 1);
            setToast({ show: true, message: `${product.name} added to cart!`, type: 'success' });
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: `Failed to add ${product.name} to cart.`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddToWishlist = async () => {
        if (!currentUser) return navigate('/login');

        try {
            await wishlistService.add(product.id);
            setToast({ show: true, message: `Added to wishlist!`, type: 'success' });
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: `Failed to add to wishlist.`, type: 'error' });
        }
    };

    const isSale = Number(product.on_sale) === 1 || product.on_sale === true;
    const isNew = Number(product.is_new) === 1 || product.is_new === true;

    return (
        <div className="product-card">
            <figure className="card-banner">
                <a href={`/product/${product.slug}`}>
                    <img src={product.image} alt={product.name} className="w-100" />
                </a>

                {isSale && <div className="card-badge red">SALE</div>}
                {isNew && <div className="card-badge green">New</div>}

                <div className="card-actions">
                    <button className="card-action-btn" aria-label="Quick view" onClick={() => navigate(`/product/${product.slug}`)}>
                        <Eye size={20} />
                    </button>

                    <button 
                        className="card-action-btn cart-btn" 
                        onClick={handleAddToCart}
                        disabled={loading || product.stock === 0}
                    >
                        <ShoppingBag size={20} />
                        <p>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</p>
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
                    {isSale ? (
                        <>
                            <span className="discount-price">₹{Number(product.discount_price).toLocaleString()}</span>
                            <span className="original-price">₹{Number(product.price).toLocaleString()}</span>
                        </>
                    ) : (
                        <span className="main-price">₹{Number(product.price).toLocaleString()}</span>
                    )}
                </div>
            </div>
            <Toast
                isOpen={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
};

export default ProductCard;

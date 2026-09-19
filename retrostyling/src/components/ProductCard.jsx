import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, ShoppingBag, Heart } from 'lucide-react';
import { cartService, wishlistService, labelService } from '../services/firestoreService';
import { useAuth } from '../services/AuthContext';
import Toast from './Toast';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [loading, setLoading] = useState(false);
    const [activeLabels, setActiveLabels] = useState([]);

    React.useEffect(() => {
        labelService.getActive().then(setActiveLabels).catch(() => setActiveLabels([]));
    }, []);

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) return navigate('/login');
        setLoading(true);

        try {
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

    const handleAddToWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();
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

    // Resolve assigned active labels
    const prodLabelIds = product.labelIds || [];
    const matchedLabels = activeLabels.filter(l => prodLabelIds.includes(l.id) && l.status === 'active');
    const productUrl = `/product/${product.slug || product.id}`;
    const imageAlt = `${product.name} - Retrostylings Fashion`;

    return (
        <div className="product-card">
            <figure className="card-banner">
                <Link to={productUrl} aria-label={`View details of ${product.name}`}>
                    <img 
                        src={product.image || '/logo.png'} 
                        alt={imageAlt} 
                        className="w-100" 
                        loading="lazy" 
                        decoding="async" 
                    />
                </Link>

                {/* Dynamic Product Badging */}
                <div className="product-badges-stack">
                    {matchedLabels.length > 0 ? (
                        matchedLabels.map((lbl) => (
                            <span
                                key={lbl.id}
                                className="dynamic-card-badge"
                                style={{
                                    backgroundColor: lbl.bgColor || '#8B5CF6',
                                    color: lbl.textColor || '#FFFFFF',
                                }}
                            >
                                {lbl.name}
                            </span>
                        ))
                    ) : (
                        <>
                            {isSale && <div className="card-badge red">SALE</div>}
                            {isNew && <div className="card-badge green">New</div>}
                        </>
                    )}
                </div>

                <div className="card-actions">
                    <Link to={productUrl} className="card-action-btn" aria-label={`Quick view ${product.name}`}>
                        <Eye size={20} />
                    </Link>

                    <button 
                        className="card-action-btn cart-btn" 
                        onClick={handleAddToCart}
                        disabled={loading || product.stock === 0}
                        aria-label={product.stock === 0 ? 'Out of Stock' : `Add ${product.name} to Cart`}
                    >
                        <ShoppingBag size={20} />
                        <p>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</p>
                    </button>

                    <button className="card-action-btn" aria-label={`Add ${product.name} to Wishlist`} onClick={handleAddToWishlist}>
                        <Heart size={20} />
                    </button>
                </div>
            </figure>

            <div className="card-content">
                <h3 className="card-title">
                    <Link to={productUrl}>{product.name}</Link>
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

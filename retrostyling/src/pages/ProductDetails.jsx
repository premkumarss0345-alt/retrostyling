import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingBag, Heart, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import './ProductDetails.css';

const ProductDetails = () => {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        fetchProduct();
    }, [slug]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5001/api/products/${slug}`);
            const data = await res.json();
            setProduct(data);
            if (data.variants && data.variants.length > 0) {
                setSelectedSize(data.variants[0].size);
                setSelectedColor(data.variants[0].color);
            }
        } catch (err) {
            console.error("Error fetching product:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="container section">Loading product details...</div>;
    if (!product) return <div className="container section">Product not found.</div>;

    const mainPrice = Number(product.on_sale) ? product.discount_price : product.price;

    return (
        <div className="product-details-page container section">
            <div className="product-details-grid">
                <div className="product-gallery">
                    <div className="main-image">
                        <img src={product.image} alt={product.name} className="w-100" />
                    </div>
                </div>

                <div className="product-info">
                    <p className="product-category-label">{product.category_name}</p>
                    <h1 className="h2">{product.name}</h1>

                    <div className="product-price-section">
                        {Number(product.on_sale) ? (
                            <>
                                <span className="current-price">₹{Number(product.discount_price).toFixed(2)}</span>
                                <span className="old-price">₹{Number(product.price).toFixed(2)}</span>
                                <span className="sale-badge">SALE</span>
                            </>
                        ) : (
                            <span className="current-price">₹{Number(product.price).toFixed(2)}</span>
                        )}
                    </div>

                    <p className="product-description">{product.description}</p>

                    {product.variants && product.variants.length > 0 && (
                        <div className="product-variants">
                            <div className="variant-group">
                                <h3>Size</h3>
                                <div className="variant-options">
                                    {[...new Set(product.variants.map(v => v.size))].map(size => (
                                        <button
                                            key={size}
                                            className={`variant-btn ${selectedSize === size ? 'active' : ''}`}
                                            onClick={() => setSelectedSize(size)}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="variant-group">
                                <h3>Color</h3>
                                <div className="variant-options">
                                    {[...new Set(product.variants.map(v => v.color))].map(color => (
                                        <button
                                            key={color}
                                            className={`variant-btn ${selectedColor === color ? 'active' : ''}`}
                                            onClick={() => setSelectedColor(color)}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="purchase-section">
                        <div className="quantity-selector">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                            <span>{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)}>+</button>
                        </div>
                        <button className="btn btn-primary add-to-cart-big">
                            <ShoppingBag size={20} />
                            ADD TO CART
                        </button>
                        <button className="wishlist-btn-round">
                            <Heart size={20} />
                        </button>
                    </div>

                    <div className="product-features-small">
                        <div className="feature-small">
                            <Truck size={24} />
                            <div>
                                <h4>Free Shipping</h4>
                                <p>On orders above ₹500</p>
                            </div>
                        </div>
                        <div className="feature-small">
                            <RotateCcw size={24} />
                            <div>
                                <h4>Easy Returns</h4>
                                <p>30-day hassle-free return</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;

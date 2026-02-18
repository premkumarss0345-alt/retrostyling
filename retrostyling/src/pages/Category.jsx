import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { API_BASE_URL } from '../config';
import './Shop.css';

const CategoryPage = () => {
    const { slug } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, [slug]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/products?category=${slug}`);
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error("Error fetching category products:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="category-page container section">
            <div className="shop-header">
                <h2 className="h2">{slug.replace('-', ' ').toUpperCase()}</h2>
                <p className="text-light">{products.length} items</p>
            </div>

            {loading ? (
                <div className="loading-state">Loading {slug}...</div>
            ) : (
                <div className="product-grid">
                    {products.length > 0 ? (
                        products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p className="no-products">No products found in this category.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategoryPage;

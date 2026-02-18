import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import './Shop.css';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        minPrice: '',
        maxPrice: '',
        search: ''
    });

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/categories');
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.category) queryParams.append('category', filters.category);
            if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
            if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
            if (filters.search) queryParams.append('search', filters.search);

            const res = await fetch(`http://localhost:5001/api/products?${queryParams.toString()}`);
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="shop-page section">
            <div className="container">
                <div className="shop-header-large">
                    <h1>Shop Collection</h1>
                    <p className="subtitle">Discover our premium range of vintage and modern aesthetics.</p>
                </div>

                <div className="shop-controls-bar">
                    <div className="search-wrapper">
                        <input
                            type="text"
                            name="search"
                            placeholder="Search products..."
                            className="search-input-large"
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filters-row">
                        <select
                            name="category"
                            className="filter-select-large"
                            value={filters.category}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.slug}>{cat.name}</option>
                            ))}
                        </select>

                        <div className="price-group">
                            <input
                                type="number"
                                name="minPrice"
                                placeholder="Min Price"
                                className="price-input-compact"
                                onChange={handleFilterChange}
                            />
                            <span>-</span>
                            <input
                                type="number"
                                name="maxPrice"
                                placeholder="Max Price"
                                className="price-input-compact"
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="shop-results-info">
                    <span>Showing {products.length} results</span>
                </div>

                {loading ? (
                    <div className="loading-state">Loading products...</div>
                ) : (
                    <div className="product-grid-full">
                        {products.length > 0 ? (
                            products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                            <div className="no-products-full">
                                <h3>No products found</h3>
                                <p>Try adjusting your search or filters to find what you're looking for.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Shop;

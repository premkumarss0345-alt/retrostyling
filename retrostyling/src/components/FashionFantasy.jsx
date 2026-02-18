import React from 'react';
import './FashionFantasy.css';

const FashionFantasy = () => {
    const categories = [
        { title: 'T-SHIRTS', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2080&auto=format&fit=crop', slug: 'tshirts' },
        { title: 'HOODIES', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2070&auto=format&fit=crop', slug: 'hoodies' },
        { title: 'WINTER WEAR', image: 'https://images.unsplash.com/photo-1544923246-77307dd654ca?q=80&w=1974&auto=format&fit=crop', slug: 'winter-wear' },
        { title: 'FOOTWEAR', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop', slug: 'footwear' },
        { title: 'ACCESSORIES', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop', slug: 'accessories' },
        { title: 'SPORTS CAPS', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=2070&auto=format&fit=crop', slug: 'sports-cap' }
    ];

    return (
        <section className="category section">
            <div className="container">
                <ul className="category-list">
                    {categories.map((cat, i) => (
                        <li key={i} className="category-item">
                            <figure className="category-banner">
                                <img src={cat.image} alt={cat.title} className="w-100" />
                            </figure>
                            <a href={`/category/${cat.slug}`} className="btn btn-secondary">{cat.title}</a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default FashionFantasy;

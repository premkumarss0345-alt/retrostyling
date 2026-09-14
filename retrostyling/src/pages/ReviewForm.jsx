import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, CheckCircle, ArrowLeft, Package, Sparkles, Image, ThumbsUp, Send, AlertCircle, ShoppingBag } from 'lucide-react';
import { reviewService, productService, orderService } from '../services/firestoreService';
import { useAuth } from '../services/AuthContext';
import SEO from '../components/SEO';
import Toast from '../components/Toast';
import './ReviewForm.css';

const RATING_DESCRIPTIONS = {
  1: 'Poor — Very disappointed',
  2: 'Below Average — Could be better',
  3: 'Good — Met standard expectations',
  4: 'Very Good — Really liked the style & quality',
  5: 'Outstanding — Premium fit & aesthetic!'
};

const ReviewForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  // URL Params
  const paramProductId = searchParams.get('productId') || searchParams.get('pid') || '';
  const paramProductName = searchParams.get('product') || '';
  const paramProductImage = searchParams.get('image') || '';
  const paramOrderId = searchParams.get('orderId') || '';
  const paramCustomer = searchParams.get('customer') || '';
  const paramEmail = searchParams.get('email') || '';

  // State
  const [productsList, setProductsList] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState(paramProductId);
  const [selectedProductName, setSelectedProductName] = useState(paramProductName);
  const [selectedProductImage, setSelectedProductImage] = useState(paramProductImage);
  const [orderId, setOrderId] = useState(paramOrderId);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [customerName, setCustomerName] = useState(paramCustomer || userProfile?.name || currentUser?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(paramEmail || currentUser?.email || '');
  const [photoUrl, setPhotoUrl] = useState('');
  const [recommend, setRecommend] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Load products and order details if orderId is provided
  useEffect(() => {
    const init = async () => {
      setLoadingInitial(true);
      try {
        // 1. If orderId is supplied, try to fetch order
        if (paramOrderId) {
          try {
            const orderData = await orderService.getById(paramOrderId);
            if (orderData) {
              if (orderData.customerName && !customerName) {
                setCustomerName(orderData.customerName);
              }
              if (orderData.customerEmail && !customerEmail) {
                setCustomerEmail(orderData.customerEmail);
              }
              if (orderData.items && orderData.items.length > 0) {
                setOrderItems(orderData.items);
                // If no specific product is picked, default to the first item
                if (!paramProductId && !paramProductName) {
                  setSelectedProductId(orderData.items[0].productId || orderData.items[0].id || '');
                  setSelectedProductName(orderData.items[0].name || '');
                  setSelectedProductImage(orderData.items[0].image || '');
                }
              }
            }
          } catch (e) {
            console.warn('Could not load order details:', e.message);
          }
        }

        // 2. Fetch all products for selector if needed
        const prods = await productService.getAll();
        setProductsList(prods || []);

        // If productId was given but no name/image, resolve it from products
        if (paramProductId && (!paramProductName || !paramProductImage)) {
          const matched = (prods || []).find(p => p.id === paramProductId || p.slug === paramProductId);
          if (matched) {
            setSelectedProductName(matched.name);
            setSelectedProductImage(matched.image);
          }
        }
      } catch (err) {
        console.error('Failed to initialize review form:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    init();
  }, [paramOrderId, paramProductId, paramProductName, paramProductImage]);

  // Sync auth user details if available
  useEffect(() => {
    if (!customerName && (userProfile?.name || currentUser?.displayName)) {
      setCustomerName(userProfile?.name || currentUser?.displayName);
    }
    if (!customerEmail && currentUser?.email) {
      setCustomerEmail(currentUser?.email);
    }
  }, [currentUser, userProfile]);

  const handleProductSelect = (prodId) => {
    setSelectedProductId(prodId);
    const found = productsList.find(p => p.id === prodId);
    if (found) {
      setSelectedProductName(found.name);
      setSelectedProductImage(found.image);
    }
  };

  const handleOrderItemSelect = (item) => {
    setSelectedProductId(item.productId || item.id || '');
    setSelectedProductName(item.name || '');
    setSelectedProductImage(item.image || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProductName.trim()) {
      setToast({ show: true, message: 'Please select or enter the product you are reviewing.', type: 'error' });
      return;
    }

    if (!rating || rating < 1) {
      setToast({ show: true, message: 'Please select a star rating from 1 to 5.', type: 'error' });
      return;
    }

    if (!title.trim()) {
      setToast({ show: true, message: 'Please provide a short review headline.', type: 'error' });
      return;
    }

    if (!body.trim()) {
      setToast({ show: true, message: 'Please share your experience in the review description.', type: 'error' });
      return;
    }

    if (!customerName.trim()) {
      setToast({ show: true, message: 'Please enter your name.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.create({
        productId: selectedProductId || 'store-general',
        product: selectedProductName,
        productImage: selectedProductImage || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=200&auto=format&fit=crop',
        customer: customerName.trim(),
        customerEmail: customerEmail.trim() || '',
        orderId: orderId.trim() || '',
        rating: Number(rating),
        title: title.trim(),
        body: body.trim(),
        photoUrl: photoUrl.trim() || '',
        recommend: Boolean(recommend),
        verified: Boolean(orderId || currentUser),
        status: 'pending', // Pending review moderation by admin
        helpfulCount: 0,
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Review submit error:', err);
      setToast({ show: true, message: 'Failed to submit review. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setTitle('');
    setBody('');
    setPhotoUrl('');
    setRating(5);
    setSubmitted(false);
  };

  return (
    <div className="review-page">
      <SEO title="Write a Customer Review" description="Share your feedback on Retrostylings clothing and earn VIP reward points." />

      <div className="review-container">
        {/* Top Back Navigation */}
        <div className="review-nav">
          <button onClick={() => navigate(-1)} className="review-back-btn">
            <ArrowLeft size={16} /> Back
          </button>
          <span className="review-badge-verified">
            <Sparkles size={14} /> Official Customer Feedback
          </span>
        </div>

        {submitted ? (
          <motion.div
            className="review-success-card"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="review-success-icon-wrap">
              <CheckCircle size={56} className="review-success-icon" />
            </div>
            <h1 className="review-success-title">Thank You, {customerName}!</h1>
            <p className="review-success-desc">
              Your review for <strong style={{ color: 'var(--white)' }}>{selectedProductName}</strong> has been received successfully.
              Our team verifies submissions to ensure genuine community feedback.
            </p>

            <div className="review-vip-bonus-banner">
              <Sparkles size={20} className="vip-sparkle" />
              <div>
                <h4>+150 VIP Reward Points Pending</h4>
                <p>Points will be credited to your account once your review is approved.</p>
              </div>
            </div>

            <div className="review-success-actions">
              <button onClick={handleResetForAnother} className="btn btn-outline">
                Write Another Review
              </button>
              <Link to="/shop" className="btn btn-primary">
                <ShoppingBag size={16} /> Explore Retrostyling
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="review-content-grid">
            {/* Left/Sidebar: Product Preview & Instructions */}
            <div className="review-sidebar">
              <div className="review-product-preview-card">
                <div className="review-product-image-box">
                  {selectedProductImage ? (
                    <img src={selectedProductImage} alt={selectedProductName} className="review-product-img" />
                  ) : (
                    <div className="review-product-img-placeholder">
                      <Package size={36} color="var(--text-muted)" />
                    </div>
                  )}
                </div>

                <div className="review-product-info">
                  <span className="review-tag">Reviewing Item</span>
                  <h3 className="review-product-title">{selectedProductName || 'Select a Product'}</h3>
                  {orderId && (
                    <span className="review-order-pill">
                      Order #{orderId.slice(-8).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* If Order had multiple items, show switcher */}
              {orderItems.length > 1 && (
                <div className="order-items-switcher">
                  <h4>Items from your order:</h4>
                  <div className="order-items-list">
                    {orderItems.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`order-item-pick-btn ${selectedProductName === item.name ? 'active' : ''}`}
                        onClick={() => handleOrderItemSelect(item)}
                      >
                        <img src={item.image} alt={item.name} />
                        <div className="order-item-pick-info">
                          <span>{item.name}</span>
                          <small>₹{item.price}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Tips */}
              <div className="review-tips-card">
                <h4>What makes a helpful review?</h4>
                <ul>
                  <li><strong>Fit & Comfort:</strong> Was it true to size? Loose or snug?</li>
                  <li><strong>Material Quality:</strong> How is the fabric feel and stitch?</li>
                  <li><strong>Style & Aesthetic:</strong> Did the retro colors match the photos?</li>
                </ul>
              </div>
            </div>

            {/* Right: Actual Form */}
            <motion.div
              className="review-form-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="review-form-header">
                <h1>Share Your Experience</h1>
                <p>Your genuine thoughts help others discover their next favorite retro look.</p>
              </div>

              <form onSubmit={handleSubmit} className="review-main-form">
                {/* Product Selection if not locked by URL */}
                {!paramProductId && orderItems.length === 0 && (
                  <div className="review-field-group">
                    <label className="review-label">Product to Review *</label>
                    <select
                      className="review-input review-select"
                      value={selectedProductId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      required
                    >
                      <option value="">-- Choose a Product --</option>
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.brand ? `(${p.brand})` : ''}
                        </option>
                      ))}
                    </select>
                    {!selectedProductId && (
                      <input
                        type="text"
                        className="review-input"
                        placeholder="Or enter product name manually..."
                        style={{ marginTop: '0.5rem' }}
                        value={selectedProductName}
                        onChange={(e) => setSelectedProductName(e.target.value)}
                      />
                    )}
                  </div>
                )}

                {/* Rating Stars */}
                <div className="review-field-group">
                  <label className="review-label">Overall Rating *</label>
                  <div className="star-rating-selector">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = star <= (hoverRating || rating);
                      return (
                        <button
                          key={star}
                          type="button"
                          className="star-rate-btn"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          aria-label={`${star} star`}
                        >
                          <Star
                            size={32}
                            className={`star-icon ${active ? 'filled' : ''}`}
                            fill={active ? '#F59E0B' : 'transparent'}
                            color={active ? '#F59E0B' : 'var(--text-faint)'}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="rating-desc-badge">
                    {RATING_DESCRIPTIONS[hoverRating || rating]}
                  </div>
                </div>

                {/* Review Headline */}
                <div className="review-field-group">
                  <label className="review-label">Review Headline *</label>
                  <input
                    type="text"
                    className="review-input"
                    placeholder="e.g. Absolutely in love with the vintage vibe & heavy fabric!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>

                {/* Review Body */}
                <div className="review-field-group">
                  <label className="review-label">Written Feedback *</label>
                  <textarea
                    className="review-textarea"
                    rows={5}
                    placeholder="Describe what you liked or disliked. How did it feel, what size did you pick, and would you buy again?"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                </div>

                {/* Photo Attachment (URL / Upload) */}
                <div className="review-field-group">
                  <label className="review-label">
                    <Image size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Photo Attachment (Optional)
                  </label>
                  <input
                    type="url"
                    className="review-input"
                    placeholder="Paste an image URL of your look (e.g. https://...)"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                  {photoUrl && (
                    <div className="review-photo-preview">
                      <img src={photoUrl} alt="Review attachment preview" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                </div>

                {/* Customer Details */}
                <div className="review-row-2">
                  <div className="review-field-group">
                    <label className="review-label">Your Name / Nickname *</label>
                    <input
                      type="text"
                      className="review-input"
                      placeholder="e.g. Arjun K."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="review-field-group">
                    <label className="review-label">Your Email (Private)</label>
                    <input
                      type="email"
                      className="review-input"
                      placeholder="e.g. arjun@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Recommendation Checkbox */}
                <div className="review-checkbox-row" onClick={() => setRecommend(!recommend)}>
                  <input
                    type="checkbox"
                    id="recommend-check"
                    checked={recommend}
                    onChange={(e) => setRecommend(e.target.checked)}
                  />
                  <label htmlFor="recommend-check">
                    <ThumbsUp size={16} color="var(--primary)" /> I recommend this item to other retro fashion enthusiasts
                  </label>
                </div>

                {/* Submit Action */}
                <div className="review-submit-section">
                  <button
                    type="submit"
                    className="btn btn-primary btn-submit-review"
                    disabled={submitting}
                  >
                    {submitting ? (
                      'Submitting Review...'
                    ) : (
                      <>
                        <Send size={18} /> Submit Review
                      </>
                    )}
                  </button>
                  <p className="review-disclaimer">
                    By submitting, you agree that your review is based on genuine purchase and adheres to Retrostylings community guidelines.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
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

export default ReviewForm;

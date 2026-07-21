import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Heart, MapPin, CreditCard, Shield, Bell, 
  LogOut, Package, ChevronRight, Plus, Trash2, Edit2, Lock, 
  Smartphone, Check, X, Award, Share2, Eye, RefreshCw, Zap, ArrowLeft, ArrowRight, Star, Trophy,
  Image as ImageIcon, RotateCcw, Download
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { addressService, orderService, wishlistService, cartService, productService, returnService, shippingSettingsService, rewardsService, invoiceTemplateService, reviewService } from '../services/firestoreService';
import Toast from '../components/Toast';
import './Profile.css';

// Formatting helpers
const formatDate = (ts) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── FLASH SALE TIMER ──────────────────────────────────────────
const FlashSaleTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 14, s: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { h: prev.h, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return { h: 0, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="flash-timer">
      <span>{pad(timeLeft.h)}</span>:<span>{pad(timeLeft.m)}</span>:<span>{pad(timeLeft.s)}</span>
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────
const Profile = () => {
  const { currentUser, logout, userProfile } = useAuth();
  const navigate = useNavigate();

  // State variables
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, wishlist, address, payment, rewards, security, notifications
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [rewardData, setRewardData] = useState({ points: 0, tier: 'Bronze', vipId: 'N/A', memberSince: new Date().getFullYear() });

  // Return state
  const [myReturns, setMyReturns] = useState([]);
  const [returnModal, setReturnModal] = useState(null); // { order, item }
  const [returnForm, setReturnForm] = useState({ reason: '', description: '' });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const RETURN_REASONS = [
    'Wrong size / fit issue',
    'Product damaged / defective',
    'Wrong item delivered',
    'Not as described',
    'Changed my mind',
    'Quality issue',
    'Other',
  ];

  const [returnWindowDays, setReturnWindowDays] = useState(7);

  // Review state
  const [reviewModal, setReviewModal] = useState(null); // { order, item }
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnModal) return;
    setSubmittingReturn(true);
    try {
      const { order, item } = returnModal;
      await returnService.create({
        orderId: order.id,
        productId: item.productId,
        productName: item.name,
        productImage: item.image || '',
        reason: returnForm.reason || 'Wrong size / fit issue',
        description: returnForm.description || '',
        images: [],
        customerId: currentUser.uid,
        customerName: currentUser.displayName || currentUser.email || 'Customer',
        customerEmail: currentUser.email || '',
      });
      showMsg('Return request submitted successfully!', 'success');
      setReturnModal(null);
      const rets = await returnService.getMyReturns();
      setMyReturns(rets);
    } catch (err) {
      console.error(err);
      showMsg('Failed to submit return request.', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    setSubmittingReview(true);
    try {
      const { order, item } = reviewModal;
      await reviewService.create({
        productId: item.productId,
        product: item.name,
        customer: currentUser.displayName || currentUser.email || 'Customer',
        customerEmail: currentUser.email || '',
        rating: Number(reviewForm.rating),
        title: reviewForm.title,
        body: reviewForm.body,
        status: 'pending',
        helpful: 0,
        date: new Date().toISOString().split('T')[0],
      });
      showMsg('Review submitted successfully! It will appear once approved.', 'success');
      setReviewModal(null);
    } catch (err) {
      console.error(err);
      showMsg('Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Address sub-state
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [addrForm, setAddrForm] = useState({ type: 'Home', name: '', street: '', city: '', zip: '', isDefault: false });

  // Payment mock state
  const [cards, setCards] = useState([
    { id: '1', brand: 'VISA', last4: '8842', exp: '12/28', isDefault: true, name: 'MUNEESWARAN P' },
    { id: '2', brand: 'MasterCard', last4: '1095', exp: '08/29', isDefault: false, name: 'MUNEESWARAN P' }
  ]);
  const [upis, setUpis] = useState([
    { id: '1', provider: 'Google Pay', vpa: 'muneeswaranmd2004@okaxis', isDefault: true },
    { id: '2', provider: 'PhonePe', vpa: 'premkumarss0345@ybl', isDefault: false }
  ]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({ brand: 'VISA', number: '', exp: '', name: 'MUNEESWARAN P' });
  const [showUpiForm, setShowUpiForm] = useState(false);
  const [upiForm, setUpiForm] = useState({ provider: 'Google Pay', vpa: '' });

  const handleCardSave = (e) => {
    e.preventDefault();
    if (!cardForm.number || !cardForm.exp || !cardForm.name) {
      showMsg('Please fill in all fields', 'error');
      return;
    }
    const last4 = cardForm.number.replace(/\D/g, '').slice(-4) || '1234';
    const newCard = {
      id: Date.now().toString(),
      brand: cardForm.brand,
      last4,
      exp: cardForm.exp,
      name: cardForm.name.toUpperCase(),
      isDefault: cards.length === 0
    };
    setCards([...cards, newCard]);
    setShowCardForm(false);
    setCardForm({ brand: 'VISA', number: '', exp: '', name: 'MUNEESWARAN P' });
    showMsg('Payment card saved successfully');
  };

  const handleUpiSave = (e) => {
    e.preventDefault();
    if (!upiForm.vpa) {
      showMsg('Please enter your UPI ID', 'error');
      return;
    }
    const newUpi = {
      id: Date.now().toString(),
      provider: upiForm.provider,
      vpa: upiForm.vpa.toLowerCase().trim(),
      isDefault: upis.length === 0
    };
    setUpis([...upis, newUpi]);
    setShowUpiForm(false);
    setUpiForm({ provider: 'Google Pay', vpa: '' });
    showMsg('UPI ID saved successfully');
  };

  // Load user details
  useEffect(() => {
    window.scrollTo(0, 0);
    if (currentUser) {
      loadData();
    } else {
      navigate('/login');
    }
  }, [currentUser]);

  const showMsg = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [myOrders, wIds, cartItems, prods] = await Promise.all([
        orderService.getMyOrders(),
        wishlistService.get(),
        cartService.get(currentUser.uid),
        productService.getAll()
      ]);
      setOrders(myOrders);
      setAllProducts(prods);
      
      const wProds = await productService.getByIds(wIds);
      setWishlist(wProds);
      setCartCount(cartItems.reduce((acc, i) => acc + i.quantity, 0));
      
      // Load addresses
      setAddrLoading(true);
      const addrs = await addressService.get();
      setAddresses(addrs);

      // Load customer reward points
      try {
        const rDetails = await rewardsService.getCustomerPoints();
        setRewardData(rDetails);
      } catch (_) {}

      // Load my returns
      try {
        const rets = await returnService.getMyReturns();
        setMyReturns(rets);
      } catch (_) {}

      // Load shipping settings for return window and reward visibility
      try {
        const settings = await shippingSettingsService.get();
        if (settings) {
          setStoreSettings(settings);
          if (settings.returnWindowDays) {
            setReturnWindowDays(settings.returnWindowDays);
          }
          if (settings.hideRewards && activeTab === 'rewards') {
            setActiveTab('overview');
          }
        }
      } catch (_) {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setAddrLoading(false);
    }
  };

  // Remove from Wishlist
  const handleRemoveWishlist = async (id) => {
    try {
      await wishlistService.remove(id);
      setWishlist(prev => prev.filter(p => p.id !== id));
      showMsg('Removed from wishlist');
    } catch (err) {
      console.error(err);
    }
  };

  // Move from Wishlist to Cart
  const handleMoveToCart = async (product) => {
    try {
      const variant = product.variants?.[0] || null;
      await cartService.addItem(product, variant, 1);
      await wishlistService.remove(product.id);
      setWishlist(prev => prev.filter(p => p.id !== product.id));
      setCartCount(prev => prev + 1);
      showMsg('Item moved to cart!');
    } catch (err) {
      console.error(err);
    }
  };

  // Add Item to Cart Directly
  const handleAddToCart = async (product) => {
    try {
      const variant = product.variants?.[0] || null;
      await cartService.addItem(product, variant, 1);
      setCartCount(prev => prev + 1);
      showMsg('Added to cart!');
    } catch (err) {
      console.error(err);
    }
  };

  // Address Handlers
  const handleAddrSave = async (e) => {
    e.preventDefault();
    try {
      if (editingAddrId) {
        await addressService.update(editingAddrId, addrForm);
        showMsg('Address updated successfully');
      } else {
        await addressService.add(addrForm);
        showMsg('New address added');
      }
      setShowAddrForm(false);
      const addrs = await addressService.get();
      setAddresses(addrs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddrDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressService.delete(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      showMsg('Address deleted');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefaultAddr = async (id) => {
    try {
      await addressService.setDefault(id);
      const addrs = await addressService.get();
      setAddresses(addrs);
      showMsg('Default address updated');
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Action menu details
  const QUICK_ACTIONS = [
    { id: 'orders', title: 'My Orders', desc: `${orders.length} active order(s)`, icon: Package },
    { id: 'wishlist', title: 'Wishlist', desc: `${wishlist.length} item(s) saved`, icon: Heart },
    { id: 'address', title: 'Addresses', desc: `${addresses.length} saved location(s)`, icon: MapPin },
    { id: 'payment', title: 'Payments', desc: 'Manage credit cards & UPI', icon: CreditCard },
    ...(!storeSettings?.hideRewards ? [{ id: 'rewards', title: 'Rewards', desc: `${rewardData.points} points available`, icon: Award }] : []),
    { id: 'notifications', title: 'Notifications', desc: 'Offers & order updates', icon: Bell },
    { id: 'security', title: 'Security', desc: 'Password & authentication', icon: Shield },
  ];

  const displayName = currentUser?.displayName || userProfile?.name || 'Muneeswaran P';
  const email = currentUser?.email || 'muneeswaranmd2004@gmail.com';

  const downloadInvoice = async (order) => {
    let settings = {
      brandName: 'RetroStylings',
      tagline: 'Standard Retro-Street Tech',
      billingStreet: 'First avenue, 28-32',
      billingCity: 'Chicago, Illinois, 64000, USA',
      billingZip: '64000',
      taxPercentage: 18,
      footerNote: 'Prototype-based programming is a style of object-oriented programming in which behaviour is preserved across items.',
      invoicePrefix: 'RS'
    };
    try {
      const res = await invoiceTemplateService.get();
      if (res) settings = res;
    } catch (err) {
      console.error('Error fetching invoice template settings:', err);
    }

    const formattedDate = formatDate(order.createdAt);
    
    const shippingInfo = order.shippingAddress || {
      name: displayName,
      street: 'First avenue, 28-32',
      city: 'Chicago, Illinois, 64000, USA',
      zip: '64000'
    };

    const taxPercent = Number(settings.taxPercentage || 18);

    const itemsHtml = order.items?.map((item, idx) => {
      const price = Number(item.price_override || item.discount_price || item.price);
      const total = price * item.quantity;
      const isEven = idx % 2 === 1;
      return `
        <tr class="${isEven ? 'even-row' : ''}">
          <td style="padding: 12px 14px; text-align: left;">
            <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${item.name}</div>
            ${(item.size || item.color) ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.size ? `Size: ${item.size}` : ''} ${item.color ? `| Color: ${item.color}` : ''}</div>` : ''}
          </td>
          <td style="padding: 12px 14px; text-align: right; color: #334155;">₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 12px 14px; text-align: center; color: #334155;">${item.quantity}</td>
          <td style="padding: 12px 14px; text-align: center; color: #334155;">${taxPercent}.00%</td>
          <td style="padding: 12px 14px; text-align: center; color: #334155;">-</td>
          <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: #0f172a;">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join('') || '';

    const subtotal = order.items?.reduce((acc, item) => acc + (Number(item.price_override || item.discount_price || item.price) * item.quantity), 0) || 0;
    const shippingCost = order.shippingCost || 0;
    const tax = Math.round(subtotal * (taxPercent / 100));
    const grandTotal = (order.total || (subtotal + shippingCost + tax));

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${settings.brandName} - #${order.id.slice(-8).toUpperCase()}</title>
        <style>
          * { 
            box-sizing: border-box; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          @media print {
            body { padding: 0 !important; }
            .invoice-card { max-width: 100% !important; padding: 0 !important; }
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 35px;
          }
          .invoice-card {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td, th {
            vertical-align: top;
          }
          
          /* Header */
          .logo-badge {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #ef4444 0%, #2563eb 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 900;
            font-size: 22px;
            line-height: 44px;
            text-align: center;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
            text-transform: uppercase;
          }
          .brand-subtitle {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
            letter-spacing: 0.5px;
          }
          .invoice-title {
            font-size: 38px;
            font-weight: 800;
            color: #0f172a;
            text-align: right;
            line-height: 1;
            margin: 0 0 12px 0;
            letter-spacing: -1px;
          }
          .meta-table {
            font-size: 12px;
            text-align: right;
            margin-left: auto;
          }
          .meta-table td {
            padding: 2px 0;
          }
          .meta-label {
            color: #94a3b8;
            padding-right: 12px;
          }
          .meta-val {
            color: #0f172a;
            font-weight: 600;
          }
          
          /* Addresses */
          .address-section {
            margin-top: 35px;
            margin-bottom: 25px;
          }
          .addr-heading {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 6px;
          }
          .addr-name {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .addr-line {
            font-size: 12px;
            color: #475569;
            line-height: 1.5;
          }
          
          /* Table */
          .items-table {
            margin-top: 20px;
            margin-bottom: 25px;
          }
          .items-table th {
            background-color: #0066ff;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 14px;
          }
          .items-table tr.even-row td {
            background-color: #f8fafc;
          }
          .items-table td {
            border-bottom: 1px solid #f1f5f9;
          }
          
          /* Lower Layout */
          .instruction-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 8px;
          }
          .instruction-text {
            font-size: 12px;
            color: #475569;
            line-height: 1.6;
          }
          
          .summary-table {
            font-size: 13px;
            margin-left: auto;
          }
          .summary-table td {
            padding: 5px 0;
            text-align: right;
          }
          .summary-label {
            color: #475569;
            padding-right: 15px;
            font-weight: 500;
          }
          .summary-val {
            color: #0f172a;
            font-weight: 700;
          }
          .summary-bold .summary-label,
          .summary-bold .summary-val {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
          }
          
          .balance-due-row {
            background-color: #f1f5f9;
            border-radius: 6px;
          }
          .balance-due-row td {
            padding: 10px 14px !important;
            font-size: 15px !important;
            font-weight: 800 !important;
            color: #0f172a !important;
          }

          /* Signatures */
          .sig-title {
            border-top: 1px solid #cbd5e1;
            width: 170px;
            margin: 0 auto;
            padding-top: 6px;
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-align: center;
          }
          .sig-name {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
            text-align: center;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <!-- Header -->
          <table>
            <tr>
              <td style="width: 50%;">
                <table>
                  <tr>
                    <td style="width: 48px; padding-right: 10px;">
                      <div class="logo-badge">R</div>
                    </td>
                    <td>
                      <div class="brand-title">${settings.brandName}</div>
                      <div class="brand-subtitle">${settings.tagline}</div>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="width: 50%;">
                <div class="invoice-title">Invoice</div>
                <table class="meta-table">
                  <tr>
                    <td class="meta-label">Invoice no.:</td>
                    <td class="meta-val">${order.id.slice(-6).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td class="meta-label">Invoice date:</td>
                    <td class="meta-val">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td class="meta-label">Due:</td>
                    <td class="meta-val">${formattedDate}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Addresses -->
          <table class="address-section">
            <tr>
              <td style="width: 50%; padding-right: 20px;">
                <div class="addr-heading">From</div>
                <div class="addr-name">${settings.brandName}</div>
                <div class="addr-line">${settings.billingStreet || 'First avenue, 28-32'}</div>
                <div class="addr-line">sale@company.com</div>
                <div class="addr-line">+1 (46) 542-85-89</div>
                <div class="addr-line">company.com</div>
                <div class="addr-line">${settings.billingCity || 'Chicago, Illinois, 64000, USA'}</div>
              </td>
              <td style="width: 50%; text-align: right;">
                <div class="addr-heading">Bill to</div>
                <div class="addr-name">${shippingInfo.name || displayName}</div>
                <div class="addr-line">${email}</div>
                <div class="addr-line">${order.phone || '+1 (46) 343-85-40'}</div>
                <div class="addr-line">${shippingInfo.street || 'First avenue, 28-32'}</div>
                <div class="addr-line">${shippingInfo.city || 'Chicago, Illinois, 64000, USA'}</div>

                <div class="addr-heading" style="margin-top: 14px;">Ship to</div>
                <div class="addr-line">${shippingInfo.street || 'First avenue, 28-32'}</div>
                <div class="addr-line">${shippingInfo.city || 'Chicago, Illinois, 64000, USA'}</div>
                ${order.trackingNumber ? `<div class="addr-line" style="margin-top: 3px;"><strong>Track #:</strong> ${order.trackingNumber}</div>` : ''}
              </td>
            </tr>
          </table>

          <!-- Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 40%; text-align: left;">DESCRIPTION</th>
                <th style="width: 15%; text-align: right;">RATE, INR</th>
                <th style="width: 10%; text-align: center;">QTY</th>
                <th style="width: 11%; text-align: center;">TAX, %</th>
                <th style="width: 10%; text-align: center;">DISC, %</th>
                <th style="width: 14%; text-align: right;">AMOUNT, INR</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Lower Section -->
          <table style="width: 100%; margin-top: 15px;">
            <tr>
              <!-- Payment Instructions & Notes -->
              <td style="width: 50%; padding-right: 30px;">
                <div class="instruction-title">Payment instruction</div>
                <div class="instruction-text">
                  <strong>Payment Method:</strong> ${order.paymentMethod || 'Credit Card / UPI'}<br />
                  <strong>Status:</strong> ${(order.paymentStatus || 'paid').toUpperCase()}<br />
                  Make payments payable to Retrostylings Commerce.
                </div>

                <div class="instruction-title" style="margin-top: 22px;">Notes</div>
                <div class="instruction-text">
                  ${settings.footerNote || 'Prototype-based programming is a style of object-oriented programming in which behaviour is preserved.'}
                </div>
              </td>

              <!-- Summary Totals -->
              <td style="width: 50%;">
                <table class="summary-table">
                  <tr>
                    <td class="summary-label">Subtotal:</td>
                    <td class="summary-val">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Shipping Cost:</td>
                    <td class="summary-val">${shippingCost === 0 ? '₹0.00' : `₹${shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Sales Tax (${taxPercent}%):</td>
                    <td class="summary-val">₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr class="summary-bold">
                    <td class="summary-label" style="padding-top: 6px;">Total:</td>
                    <td class="summary-val" style="padding-top: 6px;">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Amount paid:</td>
                    <td class="summary-val">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </table>

                <!-- Balance Due Pill -->
                <table style="width: 100%; margin-top: 10px;">
                  <tr class="balance-due-row">
                    <td style="text-align: left;">Balance Due:</td>
                    <td style="text-align: right;">₹0.00</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Signatures -->
          <table style="width: 100%; margin-top: 50px;">
            <tr>
              <td style="width: 50%; text-align: center;">
                <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #0f172a; height: 32px;">${shippingInfo.name || displayName}</div>
                <div class="sig-title">Client signature</div>
                <div class="sig-name">${shippingInfo.name || displayName}</div>
              </td>
              <td style="width: 50%; text-align: center;">
                <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #0f172a; height: 32px;">Retro Stylings</div>
                <div class="sig-title">Business signature</div>
                <div class="sig-name">Authorized Signatory</div>
              </td>
            </tr>
          </table>

        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=850,height=1000');
    if (printWindow) {
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(invoiceContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 350);
    }
  };

  return (
    <div className="my-account-page">
      {toast && <Toast text={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      <div className="account-container container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link> <span>/</span> <span className="active">My Account</span>
        </div>

        {/* Welcome Section */}
        <div className="welcome-banner">
          <div className="welcome-profile-info">
            <div className="welcome-avatar-wrapper">
              <div className="welcome-avatar">{displayName.charAt(0)}</div>
              <div className="membership-badge-tag">VIP Gold</div>
            </div>
            <div>
              <h1 className="welcome-title">Welcome back, {displayName.split(' ')[0]} 👋</h1>
              <p className="welcome-subtitle">Manage your orders, wishlist, addresses, and profile all in one place.</p>
            </div>
          </div>
          {!storeSettings?.hideRewards && (
            <div className="points-luxury-summary">
              <div className="points-label">MEMBERSHIP BALANCE</div>
              <div className="points-value">{rewardData.points} <span className="points-suffix">PTS</span></div>
              <div className="points-footer">VIP Tier Progress: {rewardData.tier} Level</div>
            </div>
          )}
        </div>

        {/* Dynamic Render Section */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="overview">
              {/* Quick Actions Grid */}
              <div className="quick-actions-grid">
                {QUICK_ACTIONS.map(act => (
                  <div key={act.id} className="quick-card" onClick={() => setActiveTab(act.id)}>
                    <div className="quick-card-icon"><act.icon size={22} /></div>
                    <div className="quick-card-info">
                      <h3>{act.title}</h3>
                      <p>{act.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="quick-card logout" onClick={async () => { await logout(); navigate('/login'); }}>
                  <div className="quick-card-icon"><LogOut size={22} /></div>
                  <div className="quick-card-info">
                    <h3>Log Out</h3>
                    <p>Securely log out of your account</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} key={activeTab}>
              <div className="tab-container-card">
                <button className="back-btn" onClick={() => setActiveTab('overview')}>
                  <ArrowLeft size={16} /> Back to Overview
                </button>

                {/* --- ORDERS TAB --- */}
                {activeTab === 'orders' && (
                  <div>
                    <h2 className="tab-title">Order History</h2>
                    <p className="tab-subtitle">Track your shipments and view past invoices.</p>
                    {orders.length === 0 ? (
                      <div className="empty-state">
                        <Package size={48} className="empty-icon" />
                        <h3>No Orders Yet</h3>
                        <p>Items you buy will appear here. Start shopping our catalog.</p>
                        <Link to="/shop" className="btn btn-primary mt-4">Explore Shop</Link>
                      </div>
                    ) : (
                      <div className="orders-cards-list">
                        {orders.map(o => (
                          <div key={o.id} className="order-item-card">
                            <div className="order-item-header">
                              <div>
                                <span className="order-id-label">ORDER ID:</span>
                                <span className="order-id-val"> #{o.id.slice(-8).toUpperCase()}</span>
                              </div>
                              <div className="order-meta-info">
                                <span>Placed on {formatDate(o.createdAt)}</span>
                                <span className="sep">•</span>
                                <span className="order-price-val">₹{o.total?.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="order-item-body">
                              <div className="order-products-mini">
                                {o.items?.map((item, idx) => (
                                  <div key={idx} className="mini-prod-row">
                                    <img src={item.image || 'https://via.placeholder.com/60x80'} alt={item.name} />
                                    <div style={{ flex: 1 }}>
                                      <h4>{item.name}</h4>
                                      <p className="text-muted text-sm">Qty: {item.quantity} {item.size ? `| Size: ${item.size}` : ''}</p>
                                    </div>
                                    {o.orderStatus === 'delivered' && (
                                      <button 
                                        className="btn btn-outline btn-xs"
                                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                        onClick={() => {
                                          setReviewModal({ order: o, item });
                                          setReviewForm({ rating: 5, title: '', body: '' });
                                        }}
                                      >
                                        Write Review
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="order-tracking-timeline">
                                <div className="tracking-status-label">
                                  Status: <strong style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>{o.orderStatus}</strong>
                                </div>
                                <div className="progress-bar-track">
                                  <div 
                                    className="progress-fill" 
                                    style={{ 
                                      width: o.orderStatus === 'delivered' ? '100%' 
                                        : o.orderStatus === 'out_for_delivery' ? '80%'
                                        : o.orderStatus === 'shipped' ? '60%' 
                                        : o.orderStatus === 'packed' ? '40%' 
                                        : o.orderStatus === 'processing' ? '20%' 
                                        : '10%' 
                                    }}
                                  ></div>
                                </div>
                                <div className="tracking-steps-labels">
                                  <span className="active">Placed</span>
                                  <span className={['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(o.orderStatus) ? 'active' : ''}>Processing</span>
                                  <span className={['shipped', 'out_for_delivery', 'delivered'].includes(o.orderStatus) ? 'active' : ''}>Shipped</span>
                                  <span className={o.orderStatus === 'delivered' ? 'active' : ''}>Delivered</span>
                                </div>
                              </div>
                            </div>
                            <div className="order-item-footer">
                                {/* Return Request Button */}
                                {(() => {
                                  if (o.orderStatus !== 'delivered') return null;
                                  const deliveredEntry = o.statusHistory?.find(h => h.status === 'delivered');
                                  const deliveredAt = deliveredEntry 
                                    ? new Date(deliveredEntry.timestamp) 
                                    : (o.updatedAt?.toDate ? o.updatedAt.toDate() : (o.updatedAt ? new Date(o.updatedAt) : (o.createdAt?.toDate ? o.createdAt.toDate() : new Date())));
                                  const daysSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
                                  const withinWindow = daysSinceDelivery <= returnWindowDays;
                                  if (!withinWindow) return <span key={o.id} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Return window expired ({returnWindowDays} days)</span>;
                                  return o.items?.map((item, iIdx) => {
                                    const existingReturn = myReturns.find(r => r.orderId === o.id && r.productId === item.productId);
                                    if (existingReturn) {
                                      const RETURN_STEP_LABELS = {
                                        pending: '⏳ Return Requested',
                                        approved: '✅ Approved',
                                        pickup_scheduled: '🚚 Pickup Scheduled',
                                        received: '📦 Received',
                                        refund_initiated: '💳 Refund Initiated',
                                        refund_completed: '🎉 Refund Completed',
                                        rejected: '❌ Rejected',
                                      };
                                      return (
                                        <span key={iIdx} style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                                          {RETURN_STEP_LABELS[existingReturn.status] || existingReturn.status}
                                        </span>
                                      );
                                    }
                                    return (
                                      <button
                                        key={iIdx}
                                        className="btn btn-outline btn-sm"
                                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                        onClick={() => {
                                          setReturnModal({ order: o, item });
                                          setReturnForm({ reason: '', description: '' });
                                        }}
                                      >
                                        <RotateCcw size={13} /> Return {item.name.split(' ')[0]}
                                      </button>
                                    );
                                  });
                                })()}
                              {o.paymentLink && o.paymentStatus === 'pending' && (
                                <a
                                  href={o.paymentLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-primary btn-sm"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                    fontSize: '0.78rem', padding: '0.35rem 0.75rem',
                                    textDecoration: 'none', background: 'var(--primary)', color: 'var(--bg-main)',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  💳 Pay Now
                                </a>
                              )}
                              <button className="btn btn-outline btn-sm" onClick={() => downloadInvoice(o)}>
                                <Download size={13} style={{ marginRight: '4px' }} /> Invoice
                              </button>
                              <Link to={`/track-order`} className="btn btn-outline btn-sm">Track Order</Link>
                              <button className="btn btn-primary btn-sm" onClick={() => showMsg('Items added to cart! (Buy again)')}>Buy Again</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- WISHLIST TAB --- */}
                {activeTab === 'wishlist' && (
                  <div>
                    <div className="wishlist-header-row">
                      <div>
                        <h2 className="tab-title">My Wishlist ({wishlist.length})</h2>
                        <p className="tab-subtitle">Your curated selection of saved styles.</p>
                      </div>
                      <div className="wishlist-toolbar">
                        <button className="btn btn-ghost btn-sm" onClick={() => showMsg('Link copied to clipboard!')}><Share2 size={14} /> Share List</button>
                      </div>
                    </div>

                    {wishlist.length === 0 ? (
                      <div className="empty-state">
                        <Heart size={48} className="empty-icon" />
                        <h3>Your Wishlist is Waiting</h3>
                        <p>Save your favorite styles and discover them later.</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                          <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
                          <Link to="/shop?filter=new" className="btn btn-outline">Explore New Arrivals</Link>
                        </div>
                      </div>
                    ) : (
                      <div className="wishlist-shop-grid">
                        {wishlist.map(prod => (
                          <div key={prod.id} className="shop-product-card">
                            <div className="prod-img-wrapper">
                              <img src={prod.image} alt={prod.name} className="main-img" />
                              {prod.on_sale && <span className="discount-tag">-{Math.round(((prod.price - prod.discount_price)/prod.price)*100)}%</span>}
                              <button className="remove-fav-btn" onClick={() => handleRemoveWishlist(prod.id)} title="Remove"><X size={15} /></button>
                              <div className="prod-actions-overlay">
                                <Link to={`/product/${prod.slug}`} className="overlay-act-btn"><Eye size={14} /></Link>
                              </div>
                            </div>
                            <div className="prod-info-block">
                              <div className="prod-brand">{prod.brand || 'RetroStylings'}</div>
                              <h3 className="prod-title-heading">{prod.name}</h3>
                              <div className="prod-prices">
                                {prod.on_sale ? (
                                  <>
                                    <span className="curr-price">₹{prod.discount_price}</span>
                                    <span className="orig-price">₹{prod.price}</span>
                                  </>
                                ) : (
                                  <span className="curr-price">₹{prod.price}</span>
                                )}
                              </div>
                              <button className="btn btn-primary btn-sm w-full mt-3" onClick={() => handleMoveToCart(prod)}>
                                <ShoppingBag size={14} /> Add to Cart
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- ADDRESSES TAB --- */}
                {activeTab === 'address' && (
                  <div>
                    <h2 className="tab-title">Address Book</h2>
                    <p className="tab-subtitle">Manage your shipping and billing delivery addresses.</p>

                    {showAddrForm ? (
                      <form className="address-form-box" onSubmit={handleAddrSave}>
                        <h3 className="sub-header-title">{editingAddrId ? 'Edit Address' : 'Add New Address'}</h3>
                        <div className="form-grid-row">
                          <div className="form-group-item">
                            <label>Address Type</label>
                            <select value={addrForm.type} onChange={e => setAddrForm({ ...addrForm, type: e.target.value })}>
                              <option value="Home">Home 🏠</option>
                              <option value="Work">Work 💼</option>
                              <option value="Other">Other 📍</option>
                            </select>
                          </div>
                          <div className="form-group-item">
                            <label>Contact Name</label>
                            <input required type="text" value={addrForm.name} onChange={e => setAddrForm({ ...addrForm, name: e.target.value })} placeholder="E.g. Muneeswaran" />
                          </div>
                        </div>
                        <div className="form-group-item mt-3">
                          <label>Street Address</label>
                          <input required type="text" value={addrForm.street} onChange={e => setAddrForm({ ...addrForm, street: e.target.value })} placeholder="123 Street name, Building, Apartment" />
                        </div>
                        <div className="form-grid-row mt-3">
                          <div className="form-group-item">
                            <label>City</label>
                            <input required type="text" value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} placeholder="Mumbai" />
                          </div>
                          <div className="form-group-item">
                            <label>Zip/Postal Code</label>
                            <input required type="text" value={addrForm.zip} onChange={e => setAddrForm({ ...addrForm, zip: e.target.value })} placeholder="400001" />
                          </div>
                        </div>
                        <label className="checkbox-wrap mt-3">
                          <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm({ ...addrForm, isDefault: e.target.checked })} />
                          Set as default delivery address
                        </label>
                        <div className="form-actions-buttons mt-4">
                          <button type="submit" className="btn btn-primary">Save Address</button>
                          <button type="button" className="btn btn-outline" onClick={() => setShowAddrForm(false)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div className="addresses-list-grid">
                        <div className="add-new-address-card" onClick={() => { setEditingAddrId(null); setAddrForm({ type: 'Home', name: '', street: '', city: '', zip: '', isDefault: false }); setShowAddrForm(true); }}>
                          <Plus size={32} />
                          <span>Add New Address</span>
                        </div>
                        {addresses.map(a => (
                          <div key={a.id} className={`address-luxury-card ${a.isDefault ? 'default-active' : ''}`}>
                            <div className="card-header-badge">
                              <span className="badge badge-neutral">{a.type || 'Home'}</span>
                              {a.isDefault && <span className="default-indicator">Default</span>}
                            </div>
                            <h3 className="recipient-name">{a.name}</h3>
                            <p className="address-details">{a.street}, {a.city} - {a.zip}</p>
                            <div className="address-actions-panel">
                              <button onClick={() => { setEditingAddrId(a.id); setAddrForm(a); setShowAddrForm(true); }}><Edit2 size={13} /> Edit</button>
                              <button onClick={() => handleAddrDelete(a.id)} className="delete"><Trash2 size={13} /> Delete</button>
                              {!a.isDefault && <button onClick={() => handleSetDefaultAddr(a.id)} className="default-link">Set Default</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- PAYMENT METHODS TAB --- */}
                {activeTab === 'payment' && (
                  <div>
                    <h2 className="tab-title">Payment Methods</h2>
                    <p className="tab-subtitle">Manage your saved credit/debit cards and secure UPI VPAs.</p>

                    {showCardForm ? (
                      <form className="address-form-box" onSubmit={handleCardSave} style={{ marginBottom: '2rem' }}>
                        <h3 className="sub-header-title">Add New Credit/Debit Card</h3>
                        <div className="form-grid-row">
                          <div className="form-group-item">
                            <label>Card Network</label>
                            <select value={cardForm.brand} onChange={e => setCardForm({ ...cardForm, brand: e.target.value })}>
                              <option value="VISA">VISA</option>
                              <option value="MasterCard">MasterCard</option>
                              <option value="RuPay">RuPay</option>
                              <option value="Amex">American Express</option>
                            </select>
                          </div>
                          <div className="form-group-item">
                            <label>Cardholder Name</label>
                            <input required type="text" value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value })} placeholder="E.g. MUNEESWARAN P" />
                          </div>
                        </div>
                        <div className="form-grid-row mt-3">
                          <div className="form-group-item">
                            <label>Card Number</label>
                            <input required type="text" maxLength="19" value={cardForm.number} onChange={e => setCardForm({ ...cardForm, number: e.target.value })} placeholder="16-digit card number" />
                          </div>
                          <div className="form-group-item">
                            <label>Expiry Date</label>
                            <input required type="text" maxLength="5" value={cardForm.exp} onChange={e => setCardForm({ ...cardForm, exp: e.target.value })} placeholder="MM/YY" style={{ maxWidth: '120px' }} />
                          </div>
                        </div>
                        <div className="form-actions-buttons mt-4">
                          <button type="submit" className="btn btn-primary">Save Card</button>
                          <button type="button" className="btn btn-outline" onClick={() => setShowCardForm(false)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div className="payments-cards-grid">
                        {cards.map(c => (
                          <div key={c.id} className="payment-credit-card">
                            <div className="card-top-row">
                              <span className="card-type-label">{c.brand.toUpperCase()}</span>
                              <CreditCard size={20} />
                            </div>
                            <div className="card-number-hidden">•••• •••• •••• {c.last4}</div>
                            <div className="card-bottom-row">
                              <div>
                                <span className="card-small-label">CARD HOLDER</span>
                                <span className="card-bold-val">{c.name}</span>
                              </div>
                              <div>
                                <span className="card-small-label">EXPIRES</span>
                                <span className="card-bold-val">{c.exp}</span>
                              </div>
                            </div>
                            <button className="remove-card-btn" onClick={() => { setCards(cards.filter(card => card.id !== c.id)); showMsg('Card removed'); }}><Trash2 size={14} /></button>
                          </div>
                        ))}
                        <div className="add-payment-method-card" onClick={() => setShowCardForm(true)}>
                          <Plus size={24} />
                          <span>Add New Card</span>
                        </div>
                      </div>
                    )}

                    {/* UPI VPAs SECTION */}
                    <h3 className="upi-section-title">UPI Accounts</h3>
                    <p className="tab-subtitle" style={{ marginBottom: '1.5rem' }}>Manage your Google Pay, PhonePe, and other UPI VPAs.</p>

                    {showUpiForm ? (
                      <form className="address-form-box" onSubmit={handleUpiSave}>
                        <h3 className="sub-header-title">Add UPI VPA</h3>
                        <div className="form-grid-row">
                          <div className="form-group-item">
                            <label>UPI Provider</label>
                            <select value={upiForm.provider} onChange={e => setUpiForm({ ...upiForm, provider: e.target.value })}>
                              <option value="Google Pay">Google Pay</option>
                              <option value="PhonePe">PhonePe</option>
                              <option value="Paytm">Paytm</option>
                              <option value="BHIM UPI">BHIM UPI</option>
                            </select>
                          </div>
                          <div className="form-group-item">
                            <label>UPI ID (VPA) *</label>
                            <input required type="text" value={upiForm.vpa} onChange={e => setUpiForm({ ...upiForm, vpa: e.target.value })} placeholder="username@bank" />
                          </div>
                        </div>
                        <div className="form-actions-buttons mt-4">
                          <button type="submit" className="btn btn-primary">Save UPI ID</button>
                          <button type="button" className="btn btn-outline" onClick={() => setShowUpiForm(false)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div className="upi-list-grid">
                        {upis.map(u => (
                          <div key={u.id} className="upi-vpa-card">
                            <div className="upi-top-row">
                              <span className="upi-provider-label">{u.provider}</span>
                              <Zap size={18} color="var(--neon-yellow)" />
                            </div>
                            <div className="upi-vpa-text">{u.vpa}</div>
                            <button className="remove-upi-btn" onClick={() => { setUpis(upis.filter(upi => upi.id !== u.id)); showMsg('UPI ID removed'); }}><Trash2 size={14} /></button>
                          </div>
                        ))}
                        <div className="add-upi-method-card" onClick={() => setShowUpiForm(true)}>
                          <Plus size={24} />
                          <span>Add UPI ID</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- REWARDS TAB --- */}
                {activeTab === 'rewards' && (
                  <div>
                    <div className="wishlist-header-row">
                      <div>
                        <h2 className="tab-title">VIP Member Rewards</h2>
                        <p className="tab-subtitle">Enjoy exclusive discounts, coupons, and premium tier privileges.</p>
                      </div>
                      <Link to="/rewards" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <Trophy size={14} /> Open Full Rewards Center
                      </Link>
                    </div>
                    
                    <div className="rewards-layout-panel">
                      {/* Luxury VIP membership card design */}
                      <div className="luxury-member-card">
                        <div className="lux-card-glow"></div>
                        <div className="lux-header">
                          <div className="lux-brand">RETROSTYLINGS</div>
                          <div className="lux-badge"><Award size={20} /> {rewardData.tier.toUpperCase()} MEMBER</div>
                        </div>
                        <div className="lux-body">
                          <div className="lux-points-counter">{rewardData.points} <span className="lux-points-unit">PTS</span></div>
                          <div className="lux-holder-name">{displayName.toUpperCase()}</div>
                        </div>
                        <div className="lux-footer">
                          <span>VIP ID: {rewardData.vipId}</span>
                          <span>Member Since: {rewardData.memberSince}</span>
                        </div>
                      </div>

                      <div className="rewards-details-content">
                        <h3>Tier Progress</h3>
                        <div className="tier-progress-container">
                          <div className="tier-progress-labels">
                            <span>Gold Tier</span>
                            <span>Platinum Tier (1000 Pts)</span>
                          </div>
                          <div className="progress-bar-track neon-theme">
                            <div className="progress-fill" style={{ width: '75%' }}></div>
                          </div>
                          <p className="tier-hint">You are only <strong>250 Points</strong> away from unlocking Platinum privileges (Free priority shipping & 15% flat store discounts).</p>
                        </div>

                        <h3 className="mt-4">Available Coupons</h3>
                        <div className="coupons-grid-panel">
                          <div className="reward-coupon-card">
                            <div className="coupon-left">
                              <h4>10%</h4>
                              <p>OFF</p>
                            </div>
                            <div className="coupon-right">
                              <h5>GOLDWELCOME</h5>
                              <p>Valid on all casual wear drops.</p>
                              <button className="btn btn-outline btn-xs" onClick={() => showMsg('Coupon copied to clipboard!')}>Copy Code</button>
                            </div>
                          </div>
                          <div className="reward-coupon-card">
                            <div className="coupon-left bg-secondary-theme">
                              <h4>₹500</h4>
                              <p>CASH</p>
                            </div>
                            <div className="coupon-right">
                              <h5>RETRO500</h5>
                              <p>On orders above ₹3,000.</p>
                              <button className="btn btn-outline btn-xs" onClick={() => showMsg('Coupon copied to clipboard!')}>Copy Code</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- NOTIFICATIONS TAB --- */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="tab-title">Notification Settings</h2>
                    <p className="tab-subtitle">Manage your preferred alert and alert update options.</p>
                    <div className="settings-lux-switches">
                      <div className="lux-switch-row">
                        <div>
                          <h4>Order Alerts</h4>
                          <p>Receive push notifications and SMS updates regarding shipping status.</p>
                        </div>
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="slider"></span>
                        </label>
                      </div>
                      <div className="lux-switch-row">
                        <div>
                          <h4>Exclusive Sales & Offers</h4>
                          <p>Stay updated on seasonal sales, promo codes, and loyalty drops.</p>
                        </div>
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="slider"></span>
                        </label>
                      </div>
                      <div className="lux-switch-row">
                        <div>
                          <h4>System Activity</h4>
                          <p>Receive alerts concerning security logs and account logins.</p>
                        </div>
                        <label className="toggle-switch">
                          <input type="checkbox" />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- SECURITY TAB --- */}
                {activeTab === 'security' && (
                  <div>
                    <h2 className="tab-title">Security & Password</h2>
                    <p className="tab-subtitle">Update your credentials and enhance account protections.</p>
                    <div className="security-settings-box">
                      <form className="password-update-form" onSubmit={e => { e.preventDefault(); showMsg('Password updated!'); }}>
                        <div className="form-group-item">
                          <label>Current Password</label>
                          <input type="password" placeholder="••••••••" required />
                        </div>
                        <div className="form-group-item mt-3">
                          <label>New Password</label>
                          <input type="password" placeholder="••••••••" required />
                        </div>
                        <button type="submit" className="btn btn-primary mt-4">Change Password</button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── FLASH SALE CAROUSEL ──────────────────────────────────── */}
        <section className="dashboard-section mt-5">
          <div className="section-header-standalone flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="flash-label-tag">
                <Zap size={14} fill="currentColor" /> FLASH SALE
              </div>
              <FlashSaleTimer />
            </div>
            <Link to="/shop?filter=sale" className="link-btn">View All <ChevronRight size={16}/></Link>
          </div>
          <div className="products-horizontal-scroller">
            {allProducts.slice(0, 4).map(prod => (
              <div key={prod.id} className="scroll-product-card">
                <div className="scroll-img-box">
                  <img src={prod.image} alt={prod.name} />
                  <button className="btn btn-primary btn-sm add-quick-btn" onClick={() => handleAddToCart(prod)}>
                    <ShoppingBag size={13} /> Add
                  </button>
                </div>
                <div className="scroll-info">
                  <h4>{prod.name}</h4>
                  <div className="scroll-prices">
                    <span className="price-sale">₹{prod.discount_price || prod.price}</span>
                    {prod.on_sale && <span className="price-old">₹{prod.price}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── RECOMMENDED FOR YOU (AI RECOMMENDATION) ───────────────── */}
        <section className="dashboard-section mt-5">
          <div className="section-header-standalone">
            <h2 className="section-title">Recommended For You</h2>
            <p className="section-subtitle">Curated styles based on your shopping preferences</p>
          </div>
          <div className="products-horizontal-scroller">
            {allProducts.slice(1, 5).map(prod => (
              <div key={prod.id} className="scroll-product-card">
                <div className="scroll-img-box">
                  <img src={prod.image} alt={prod.name} />
                  <button className="btn btn-primary btn-sm add-quick-btn" onClick={() => handleAddToCart(prod)}>
                    <ShoppingBag size={13} /> Add
                  </button>
                </div>
                <div className="scroll-info">
                  <h4>{prod.name}</h4>
                  <div className="scroll-prices">
                    <span className="price-sale">₹{prod.discount_price || prod.price}</span>
                    {prod.on_sale && <span className="price-old">₹{prod.price}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── RECENTLY VIEWED ───────────────────────────────────────── */}
        <section className="dashboard-section mt-5">
          <div className="section-header-standalone">
            <h2 className="section-title">Recently Viewed</h2>
            <p className="section-subtitle">Styles you viewed during this session</p>
          </div>
          <div className="products-horizontal-scroller">
            {allProducts.slice(2, 6).map(prod => (
              <div key={prod.id} className="scroll-product-card">
                <div className="scroll-img-box">
                  <img src={prod.image} alt={prod.name} />
                  <button className="btn btn-primary btn-sm add-quick-btn" onClick={() => handleAddToCart(prod)}>
                    <ShoppingBag size={13} /> Add
                  </button>
                </div>
                <div className="scroll-info">
                  <h4>{prod.name}</h4>
                  <div className="scroll-prices">
                    <span className="price-sale">₹{prod.discount_price || prod.price}</span>
                    {prod.on_sale && <span className="price-old">₹{prod.price}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CONTINUE SHOPPING CATEGORIES ─────────────────────────── */}
        <section className="dashboard-section mt-5 mb-5">
          <div className="section-header-standalone">
            <h2 className="section-title">Continue Shopping</h2>
            <p className="section-subtitle">Navigate through your favorite style categories</p>
          </div>
          <div className="categories-luxury-grid">
            {[
              { name: 'Oversized T-Shirts', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400', slug: 't-shirts' },
              { name: 'Hoodies', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400', slug: 'hoodies' },
              { name: 'Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', slug: 'footwear' },
              { name: 'Accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', slug: 'accessories' }
            ].map(cat => (
              <Link to={`/shop?category=${cat.slug}`} key={cat.name} className="category-luxury-card">
                <img src={cat.image} alt={cat.name} className="img-cover" />
                <div className="category-overlay-content">
                  <h3>{cat.name}</h3>
                  <span className="shop-link-text">Shop Collection <ArrowRight size={14} /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Return Request Modal */}
      {returnModal && (
        <div className="pf-modal-overlay" onClick={() => setReturnModal(null)}>
          <div className="pf-modal-content" onClick={e => e.stopPropagation()}>
            <div className="pf-modal-header">
              <h3>Request Return</h3>
              <button className="pf-modal-close-btn" onClick={() => setReturnModal(null)}><X size={18} /></button>
            </div>
            <div className="pf-modal-product-summary">
              <img src={returnModal.item.image} alt={returnModal.item.name} />
              <div>
                <h4>{returnModal.item.name}</h4>
                <p>Order #{returnModal.order.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
            <form className="pf-modal-form" onSubmit={handleReturnSubmit}>
              <div className="pf-form-group">
                <label>Return Reason</label>
                <select
                  className="pf-form-input"
                  style={{ background: '#1c1c1e', color: 'white' }}
                  value={returnForm.reason}
                  onChange={e => setReturnForm(p => ({ ...p, reason: e.target.value }))}
                  required
                >
                  <option value="" disabled>Select a reason...</option>
                  {RETURN_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="pf-form-group">
                <label>Description / Feedback</label>
                <textarea
                  className="pf-form-textarea"
                  placeholder="Explain why you're returning the item..."
                  value={returnForm.description}
                  onChange={e => setReturnForm(p => ({ ...p, description: e.target.value }))}
                  required
                />
              </div>
              <div className="pf-form-group">
                <label>Upload Images (Optional)</label>
                <div className="pf-file-upload-box">
                  <ImageIcon size={18} style={{ display: 'block', margin: '0 auto 4px', color: 'var(--text-muted)' }} />
                  <span>Click to select return photos</span>
                </div>
              </div>
              <div className="pf-modal-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setReturnModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReturn}>
                  {submittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="pf-modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="pf-modal-content" onClick={e => e.stopPropagation()}>
            <div className="pf-modal-header">
              <h3>Write a Review</h3>
              <button className="pf-modal-close-btn" onClick={() => setReviewModal(null)}><X size={18} /></button>
            </div>
            <div className="pf-modal-product-summary">
              <img src={reviewModal.item.image} alt={reviewModal.item.name} />
              <div>
                <h4>{reviewModal.item.name}</h4>
                <p>Share your feedback about this product</p>
              </div>
            </div>
            <form className="pf-modal-form" onSubmit={handleReviewSubmit}>
              <div className="pf-form-group" style={{ alignItems: 'center' }}>
                <label>Your Rating</label>
                <div style={{ display: 'flex', gap: '8px', margin: '0.4rem 0' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="pf-star-btn"
                      onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                    >
                      <Star
                        size={26}
                        fill={star <= reviewForm.rating ? '#F59E0B' : 'transparent'}
                        color={star <= reviewForm.rating ? '#F59E0B' : 'var(--text-faint)'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="pf-form-group">
                <label>Review Title</label>
                <input
                  type="text"
                  className="pf-form-input"
                  placeholder="Summarize your experience (e.g. Excellent fit!)"
                  value={reviewForm.title}
                  onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>
              <div className="pf-form-group">
                <label>Review Body</label>
                <textarea
                  className="pf-form-textarea"
                  placeholder="Share details about quality, fit, style, and comfort..."
                  value={reviewForm.body}
                  onChange={e => setReviewForm(p => ({ ...p, body: e.target.value }))}
                  required
                />
              </div>
              <div className="pf-modal-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setReviewModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

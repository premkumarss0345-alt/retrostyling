import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import PopupAdModal from './components/PopupAdModal';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';
import './App.css';

/* ─── Customer Pages ─────────────────────────────────────── */
import Home from './pages/Home';
import Shop from './pages/Shop';
import Category from './pages/Category';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Contact from './pages/Contact';
import Rewards from './pages/Rewards';
import ReturnPolicy from './pages/ReturnPolicy';
import ShippingInfo from './pages/ShippingInfo';
import TrackOrder from './pages/TrackOrder';
import PaymentType from './pages/PaymentType';
import ReviewForm from './pages/ReviewForm';
import NotFound from './pages/NotFound';

/* ─── Admin Pages ────────────────────────────────────────── */
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminHeroSlides from './pages/admin/HeroSlides';
import AdminSettings from './pages/admin/Settings';
import AdminCategories from './pages/admin/Categories';
import AdminLabels from './pages/admin/Labels';
import AdminInventory from './pages/admin/Inventory';
import AdminBrands from './pages/admin/Brands';
import AdminCoupons from './pages/admin/Coupons';
import AdminBanners from './pages/admin/Banners';
import AdminPromotions from './pages/admin/Promotions';
import AdminReviews from './pages/admin/Reviews';
import AdminReports from './pages/admin/Reports';
import AdminMarketing from './pages/admin/Marketing';
import AdminPopupAds from './pages/admin/marketing/PopupAds';
import AdminWhatsAppCatalog from './pages/admin/marketing/WhatsAppCatalog';
import AdminMediaLibrary from './pages/admin/MediaLibrary';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSuperAdmin from './pages/admin/SuperAdmin';
import AdminNotifications from './pages/admin/Notifications';
import AdminCustomers from './pages/admin/Customers';
import AdminReturns from './pages/admin/Returns';
import AdminShippingSettings from './pages/admin/ShippingSettings';
import AdminSupport from './pages/admin/Support';
import AmazonSync from './pages/admin/AmazonSync';

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const showNav = !isAdmin && !isAuthPage;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  const adminRoute = (path, Component) => (
    <Route
      path={path}
      element={
        <ProtectedRoute adminOnly={true}>
          <Component />
        </ProtectedRoute>
      }
    />
  );

  return (
    <div className="app">
      {showNav && <Navbar />}
      <Routes>
        {/* ─── Indexable Store & Category Routes ─── */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:categorySlug" element={<Shop />} />
        <Route path="/shop/:categorySlug/:subcategorySlug" element={<Shop />} />
        <Route path="/category/:slug" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetails />} />

        {/* Clean URL Shortcuts */}
        <Route path="/sale" element={<Shop defaultSale={true} />} />
        <Route path="/new-arrivals" element={<Shop defaultNewArrivals={true} />} />
        <Route path="/best-sellers" element={<Shop defaultSort="popular" />} />
        <Route path="/mens" element={<Shop defaultCategorySlug="mens" />} />
        <Route path="/mens/:subcategorySlug" element={<Shop defaultCategorySlug="mens" />} />
        <Route path="/womens" element={<Shop defaultCategorySlug="womens" />} />
        <Route path="/womens/:subcategorySlug" element={<Shop defaultCategorySlug="womens" />} />

        {/* ─── Private & Checkout Routes (Noindex) ─── */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ─── Information & Customer Care Routes ─── */}
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/shipping-info" element={<ShippingInfo />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/payment-type" element={<PaymentType />} />
        <Route path="/review" element={<ReviewForm />} />
        <Route path="/write-review" element={<ReviewForm />} />
        <Route path="/blog" element={
          <div className="container section">
            <h1>Fashion Blog & Styling Guides</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Stay tuned for the latest streetwear trends, styling tips, and brand updates from Retrostylings.</p>
          </div>
        } />

        {/* ─── Admin Routes (Private) ─── */}
        {adminRoute('/admin', AdminDashboard)}
        {adminRoute('/admin/products', AdminProducts)}
        {adminRoute('/admin/categories', AdminCategories)}
        {adminRoute('/admin/labels', AdminLabels)}
        {adminRoute('/admin/brands', AdminBrands)}
        {adminRoute('/admin/inventory', AdminInventory)}
        {adminRoute('/admin/orders', AdminOrders)}
        {adminRoute('/admin/customers', AdminCustomers)}
        {adminRoute('/admin/users', AdminUsers)}
        {adminRoute('/admin/coupons', AdminCoupons)}
        {adminRoute('/admin/banners', AdminBanners)}
        {adminRoute('/admin/promotions', AdminPromotions)}
        {adminRoute('/admin/hero-slides', AdminHeroSlides)}
        {adminRoute('/admin/reviews', AdminReviews)}
        {adminRoute('/admin/media', AdminMediaLibrary)}
        {adminRoute('/admin/marketing', AdminMarketing)}
        {adminRoute('/admin/marketing/popup-ads', AdminPopupAds)}
        {adminRoute('/admin/marketing/whatsapp-catalog', AdminWhatsAppCatalog)}
        {adminRoute('/admin/notifications', AdminNotifications)}
        {adminRoute('/admin/reports', AdminReports)}
        {adminRoute('/admin/analytics', AdminAnalytics)}
        {adminRoute('/admin/settings', AdminSettings)}
        {adminRoute('/admin/super-admin', AdminSuperAdmin)}
        {adminRoute('/admin/returns', AdminReturns)}
        {adminRoute('/admin/shipping', AdminShippingSettings)}
        {adminRoute('/admin/support', AdminSupport)}
        {adminRoute('/admin/amazon-sync', AmazonSync)}

        {/* ─── 404 Catch-All Route ─── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNav && <BottomNav />}
      {showNav && <WhatsAppFloatingButton />}
      {showNav && <PopupAdModal />}
      {showNav && <Footer />}
    </div>
  );
}

function App() {
  // Show splash only once per browser session
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <Router>
        <AppContent />
      </Router>
    </>
  );
}

export default App;

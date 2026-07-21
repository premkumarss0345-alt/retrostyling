import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
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

/* ─── Admin Pages ────────────────────────────────────────── */
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminHeroSlides from './pages/admin/HeroSlides';
import AdminSettings from './pages/admin/Settings';
import AdminCategories from './pages/admin/Categories';
import AdminInventory from './pages/admin/Inventory';
import AdminBrands from './pages/admin/Brands';
import AdminCoupons from './pages/admin/Coupons';
import AdminBanners from './pages/admin/Banners';
import AdminReviews from './pages/admin/Reviews';
import AdminReports from './pages/admin/Reports';
import AdminMarketing from './pages/admin/Marketing';
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
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
        {/* ─── Customer Routes ─── */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<Profile />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/shipping-info" element={<ShippingInfo />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/payment-type" element={<PaymentType />} />
        <Route path="/blog" element={
          <div className="container section">
            <h1>Our Blog</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Stay tuned for the latest fashion trends and updates.</p>
          </div>
        } />

        {/* ─── Admin Routes ─── */}
        {adminRoute('/admin', AdminDashboard)}
        {adminRoute('/admin/products', AdminProducts)}
        {adminRoute('/admin/categories', AdminCategories)}
        {adminRoute('/admin/brands', AdminBrands)}
        {adminRoute('/admin/inventory', AdminInventory)}
        {adminRoute('/admin/orders', AdminOrders)}
        {adminRoute('/admin/customers', AdminCustomers)}
        {adminRoute('/admin/users', AdminUsers)}
        {adminRoute('/admin/coupons', AdminCoupons)}
        {adminRoute('/admin/banners', AdminBanners)}
        {adminRoute('/admin/hero-slides', AdminHeroSlides)}
        {adminRoute('/admin/reviews', AdminReviews)}
        {adminRoute('/admin/media', AdminMediaLibrary)}
        {adminRoute('/admin/marketing', AdminMarketing)}
        {adminRoute('/admin/notifications', AdminNotifications)}
        {adminRoute('/admin/reports', AdminReports)}
        {adminRoute('/admin/analytics', AdminAnalytics)}
        {adminRoute('/admin/settings', AdminSettings)}
        {adminRoute('/admin/super-admin', AdminSuperAdmin)}
        {adminRoute('/admin/returns', AdminReturns)}
        {adminRoute('/admin/shipping', AdminShippingSettings)}
        {adminRoute('/admin/support', AdminSupport)}
        {adminRoute('/admin/amazon-sync', AmazonSync)}
      </Routes>
      {showNav && <BottomNav />}
      {showNav && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

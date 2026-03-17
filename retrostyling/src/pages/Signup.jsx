import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Chrome } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import Toast from '../components/Toast';
import './Login.css';

const Signup = () => {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState({ show: false, message: '', type: 'error' });

  const { signup, loginWithGoogle } = useAuth();
  const navigate                  = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setToast({ show: true, message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      setToast({ show: true, message: 'Account created! Welcome 🎉', type: 'success' });
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'Email already registered. Try logging in.'
          : err.message;
      setToast({ show: true, message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setToast({ show: true, message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-image-section" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=2000")' }}>
        <div className="login-image-content">
          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Join the <br /> Revolution.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            Create an account to track orders, save items to your wishlist, and get exclusive access to new drops.
          </motion.p>
        </div>
      </section>

      <section className="login-form-section">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="login-header">
            <h1>Create Account</h1>
            <p>Join Retrostyling — your fashion destination</p>
          </div>

          <form onSubmit={handleSignup} className="login-form">
            <div className="input-container">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-container">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-container">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account...' : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>

          <div className="divider"><span>or</span></div>

          <button
            className="btn-google"
            onClick={handleGoogle}
            disabled={loading}
          >
            <Chrome size={18} /> Continue with Google
          </button>

          <p className="login-footer">
            Already have an account?{' '}
            <Link to="/login" className="link-accent">Sign In</Link>
          </p>
        </motion.div>
      </section>

      <Toast
        isOpen={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default Signup;


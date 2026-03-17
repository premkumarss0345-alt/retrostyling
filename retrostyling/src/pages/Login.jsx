import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, Chrome } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import Toast from '../components/Toast';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const showToast = (message, type = 'error') =>
        setToast({ show: true, message, type });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            showToast('Welcome back!', 'success');
            setTimeout(() => navigate('/'), 1000);
        } catch (err) {
            const msg =
                err.code === 'auth/invalid-credential'
                    ? 'Invalid email or password'
                    : err.code === 'auth/too-many-requests'
                        ? 'Too many attempts. Try again later.'
                        : err.message;
            showToast(msg);
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
            showToast(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <section className="login-image-section" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1483389127117-b6a2102724ae?auto=format&fit=crop&q=80&w=2000")' }}>
                <div className="login-image-content">
                    <motion.h2
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Redefining <br /> Retro.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Join the community of fashion-forward individuals and elevate your streetwear game with Retrostylings.
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
                        <h1>Welcome Back</h1>
                        <p>Sign in to your Retrostyling account</p>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="input-container">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="e.g. admin@retrostylings.com"
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
                                    placeholder="Enter your password"
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

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={loading}
                        >
                            {loading ? 'Authenticating...' : <><LogIn size={18} /> Sign In</>}
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
                        Don't have an account?{' '}
                        <Link to="/signup" className="link-accent">Sign Up</Link>
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

export default Login;

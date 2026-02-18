import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import './Toast.css';

const Toast = ({ message, isOpen, onClose, type = 'success' }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: 50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    className={`toast-container ${type}`}
                >
                    <div className="toast-content">
                        <CheckCircle size={20} className="toast-icon" />
                        <span className="toast-message">{message}</span>
                    </div>
                    <button className="toast-close" onClick={onClose}>
                        <X size={16} />
                    </button>
                    <motion.div
                        className="toast-progress"
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 3, ease: 'linear' }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;

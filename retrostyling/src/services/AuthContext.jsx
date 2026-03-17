/**
 * AuthContext.jsx
 * Replaces token-based auth. Uses Firebase Auth + Firestore user profiles.
 * Provides: currentUser, userProfile (with role), login, signup, logout helpers.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';
import { userService } from './firestoreService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const profile = await userService.getProfile(user.uid);
                    setUserProfile(profile);
                } catch {
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }
            setAuthLoading(false);
        });
        return unsub;
    }, []);

    const signup = async (email, password, name) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await userService.syncUser(cred.user, { name, role: 'customer' });
        const profile = await userService.getProfile(cred.user.uid);
        setUserProfile(profile);
        return cred;
    };

    const login = async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await userService.getProfile(cred.user.uid);
        // If no profile yet (legacy users), create one
        if (!profile) {
            await userService.syncUser(cred.user, { role: 'customer' });
            const newProfile = await userService.getProfile(cred.user.uid);
            setUserProfile(newProfile);
        } else {
            setUserProfile(profile);
        }
        return cred;
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        await userService.syncUser(cred.user, { role: 'customer' });
        const profile = await userService.getProfile(cred.user.uid);
        setUserProfile(profile);
        return cred;
    };

    const logout = async () => {
        await signOut(auth);
        setUserProfile(null);
    };

    const isAdmin = userProfile?.role === 'admin' || currentUser?.email === 'admin@retrostylings.com';

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                userProfile,
                authLoading,
                isAdmin,
                signup,
                login,
                loginWithGoogle,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

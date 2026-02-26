import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signOut,
    signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

import api from '../services/api';
import LoadingScreen from '../components/LoadingScreen';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [memberData, setMemberData] = useState(null);

    const loginWithGoogle = () => {
        return signInWithPopup(auth, googleProvider);
    };

    const loginCustom = async (email, password, type) => {
        setLoading(true);
        try {
            const endpoint = type === 'staff' ? '/auth/login-staff' : '/auth/login-user';
            const res = await api.post(endpoint, { email, password });
            const { token, member } = res.data;
            localStorage.setItem('authToken', token);
            setUser({ email: member.email, displayName: `${member.personalInfo.firstName} ${member.personalInfo.lastName}`, isCustom: true });
            setRole(member.role);
            setMemberData(member);
            return true;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const registerUser = async (name, email, password) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/register-user', { name, email, password });
            const { token, member } = res.data;
            localStorage.setItem('authToken', token);
            setUser({ email: member.email, displayName: `${member.personalInfo.firstName} ${member.personalInfo.lastName}`, isCustom: true });
            setRole('user');
            setMemberData(member);
            return true;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        localStorage.removeItem('authToken');
        await signOut(auth);
        setUser(null);
        setRole(null);
        setMemberData(null);
    };

    useEffect(() => {
        const checkAuth = async () => {
            // Priority 1: Firebase User (Admin)
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                    try {
                        const response = await api.post('/auth/sync');
                        setRole(response.data.role);
                        setMemberData(response.data);
                    } catch (error) {
                        setRole('user'); // Fallback
                    }
                    setLoading(false);
                } else {
                    // Priority 2: Manual Token (Staff/User)
                    const authToken = localStorage.getItem('authToken');
                    if (authToken) {
                        try {
                            const response = await api.get('/members/me');
                            setUser({ email: response.data.email, isCustom: true });
                            setRole(response.data.role);
                            setMemberData(response.data);
                        } catch (err) {
                            localStorage.removeItem('authToken');
                            setUser(null);
                            setRole(null);
                        }
                    } else {
                        setUser(null);
                        setRole(null);
                        setMemberData(null);
                    }
                    setLoading(false);
                }
            });
            return unsubscribe;
        };

        const unsub = checkAuth();
        return () => unsub.then(f => f());
    }, []);

    const value = {
        user,
        role,
        memberData,
        loginWithGoogle,
        loginCustom,
        registerUser,
        logout,
        loading
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

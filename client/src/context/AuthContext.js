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

    const loginStaff = async (email, password) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/login-staff', { email, password });
            const { token, member } = res.data;
            localStorage.setItem('staffToken', token);
            setUser({ email: member.email, displayName: `${member.personalInfo.firstName} ${member.personalInfo.lastName}`, isStaff: true });
            setRole('staff');
            setMemberData(member);
            return true;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        localStorage.removeItem('staffToken');
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
                        setRole('staff'); // Fallback
                    }
                    setLoading(false);
                } else {
                    // Priority 2: Manual Token (Staff)
                    const staffToken = localStorage.getItem('staffToken');
                    if (staffToken) {
                        try {
                            const response = await api.get('/members/me'); // We should add this endpoint
                            setUser({ email: response.data.email, isStaff: true });
                            setRole('staff');
                            setMemberData(response.data);
                        } catch (err) {
                            localStorage.removeItem('staffToken');
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
        loginStaff,
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

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

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    // Sync with backend and get member data (including role)
                    const response = await api.post('/auth/sync');
                    setRole(response.data.role);
                    setMemberData(response.data);
                } catch (error) {
                    console.error('[AuthContext] Sync Error:', error.response?.data?.message || error.message);
                    // Default to staff if sync fails but user is authenticated
                    setRole('staff');
                }
            } else {
                setRole(null);
                setMemberData(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        role,
        memberData,
        loginWithGoogle,
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

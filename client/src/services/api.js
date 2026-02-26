import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    async (config) => {
        // 1. Try Firebase Token
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            // 2. Try Manual Token (for staff)
            const manualToken = localStorage.getItem('staffToken');
            if (manualToken) {
                config.headers.Authorization = `Bearer ${manualToken}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;

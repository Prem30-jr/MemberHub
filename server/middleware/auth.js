const admin = require('firebase-admin');

// Initialize Firebase Admin
// In a real app, you'd use a service account JSON file
// For this demo, we'll assume the environment has the necessary credentials or we mock if needed
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID,
    });
}

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        // Try Firebase verification first (for admins/synced users)
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.user = decodedToken;
            return next();
        } catch (firebaseErr) {
            // If Firebase fails, try custom JWT (for staff)
            const jwt = require('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET || 'memberhub_secret_2024';

            const decoded = jwt.verify(token, JWT_SECRET);
            // Simulate the firebase structure for checkRole compatibility
            req.user = { uid: decoded.id, customAuth: true };
            next();
        }
    } catch (error) {
        console.error('Auth Verification Error:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const checkRole = (roles) => {
    return async (req, res, next) => {
        try {
            const Member = require('../models/Member');
            let member;

            if (req.user.customAuth) {
                member = await Member.findById(req.user.uid);
            } else {
                member = await Member.findOne({ firebaseUid: req.user.uid });
            }

            if (!member) {
                console.warn(`[AuthMiddleware] Access Denied: No member record for UID ${req.user.uid} on ${req.originalUrl}`);
                return res.status(403).json({
                    message: 'User profile not found. Please contact support.',
                });
            }

            if (!roles.includes(member.role)) {
                console.warn(`[AuthMiddleware] Forbidden: UID ${req.user.uid} (${member.role}) tried to access ${req.originalUrl}. Required: ${roles}`);
                return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
            }

            req.member = member;
            next();
        } catch (error) {
            console.error('[AuthMiddleware] Role check error:', error);
            res.status(500).json({ message: 'Internal server error during authorization' });
        }
    };
};

module.exports = { verifyToken, checkRole };

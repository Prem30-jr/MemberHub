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
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Firebase Auth Error:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const checkRole = (roles) => {
    return async (req, res, next) => {
        try {
            const Member = require('../models/Member');
            const member = await Member.findOne({ firebaseUid: req.user.uid });

            if (!member) {
                console.warn(`[AuthMiddleware] Access Denied: No member record for UID ${req.user.uid} on ${req.originalUrl}`);
                return res.status(403).json({
                    message: 'User profile not found. Please sync your account.',
                    reason: 'UID_NOT_FOUND',
                    uid: req.user.uid
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

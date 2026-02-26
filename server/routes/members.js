const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { verifyToken, checkRole } = require('../middleware/auth');

const { generateRecommendation } = require('../services/recommendationService');
const { calculateChurnRisk } = require('../services/churnPredictionService');
const { generateSmartMessage } = require('../services/aiMessageService');

// @route   GET /api/members
// @desc    Get all members
// @access  Admin/Staff
router.get('/', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const members = await Member.find().populate('currentPlan').populate('recommendation.plan');
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/members/:id
// @desc    Get single member (Triggers Rec Engine)
// @access  Admin/Staff
router.get('/:id', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        // Trigger AI Recommendation Engine and Churn Prediction on view
        await generateRecommendation(req.params.id);
        await calculateChurnRisk(req.params.id);

        const member = await Member.findById(req.params.id)
            .populate('currentPlan')
            .populate('recommendation.plan');

        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json(member);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/members
// @desc    Register a new member
// @access  Admin/Staff
router.post('/', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { firstName, lastName, email, firebaseUid, planId, phone, address } = req.body;
    try {
        if (!planId) {
            return res.status(400).json({ message: 'Plan ID is required' });
        }

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const startDate = new Date();
        const endDate = new Date();

        // Duration logic
        if (plan.duration === 'monthly') endDate.setMonth(startDate.getMonth() + 1);
        else if (plan.duration === 'quarterly') endDate.setMonth(startDate.getMonth() + 3);
        else if (plan.duration === 'yearly') endDate.setFullYear(startDate.getFullYear() + 1);

        const newMember = new Member({
            personalInfo: { firstName, lastName, phone, address },
            email,
            firebaseUid,
            currentPlan: planId,
            status: 'Active',
            startDate,
            endDate
        });

        await newMember.save();
        res.status(201).json(newMember);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PATCH /api/members/:id
// @desc    Update a member
// @access  Admin/Staff
router.patch('/:id', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const { planId, status, personalInfo } = req.body;
        const member = await Member.findById(req.params.id);

        if (!member) return res.status(404).json({ message: 'Member not found' });

        if (planId && planId !== member.currentPlan?.toString()) {
            const plan = await SubscriptionPlan.findById(planId);
            if (plan) {
                member.currentPlan = planId;
                // Recalculate expiry if plan changes? For simplicity, we'll keep it as is or reset.
                // Resetting for consistency:
                const startDate = new Date();
                const endDate = new Date();
                if (plan.duration === 'monthly') endDate.setMonth(startDate.getMonth() + 1);
                else if (plan.duration === 'quarterly') endDate.setMonth(startDate.getMonth() + 3);
                else if (plan.duration === 'yearly') endDate.setFullYear(startDate.getFullYear() + 1);
                member.startDate = startDate;
                member.endDate = endDate;
            }
        }

        if (status) member.status = status;
        if (personalInfo) member.personalInfo = { ...member.personalInfo, ...personalInfo };

        await member.save();
        const updatedMember = await Member.findById(member._id).populate('currentPlan');
        res.json(updatedMember);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/members/:id
// @desc    Delete a member
// @access  Admin only
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const member = await Member.findByIdAndDelete(req.params.id);
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json({ message: 'Member deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   GET /api/members/:id/payments
// @desc    Get payment history for a member
// @access  Admin/Staff
router.get('/:id/payments', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const Payment = require('../models/Payment');
        const payments = await Payment.find({ member: req.params.id }).populate('plan').sort({ paymentDate: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/members/:id/generate-message
// @desc    Generate AI smart message for member based on churn risk
// @access  Admin/Staff
router.post('/:id/generate-message', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const smartMessage = await generateSmartMessage(req.params.id);
        res.json(smartMessage);
    } catch (err) {
        res.status(500).json({ message: 'Failed to generate message', error: err.message });
    }
});

module.exports = router;

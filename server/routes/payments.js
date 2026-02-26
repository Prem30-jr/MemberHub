const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const { verifyToken, checkRole } = require('../middleware/auth');
const { generateRecommendation } = require('../services/recommendationService');
const { calculateChurnRisk } = require('../services/churnPredictionService');

// @route   GET /api/payments
// @desc    Get all payments
// @access  Admin/Staff
router.get('/', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const payments = await Payment.find().populate('member').populate('plan');
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/payments
// @desc    Record a new payment
// @access  Admin/Staff
router.post('/', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { memberId, planId, amount, transactionId, status } = req.body;
    try {
        const newPayment = new Payment({
            member: memberId,
            plan: planId,
            amount,
            transactionId,
            status: status || 'Paid'
        });

        await newPayment.save();

        // If payment is successful, update member status and end date
        if (newPayment.status === 'Paid') {
            const member = await Member.findById(memberId).populate('currentPlan');
            if (member && member.currentPlan) {
                const today = new Date();
                member.status = 'Active';
                member.startDate = today;

                const endDate = new Date(today);
                if (member.currentPlan.duration === 'monthly') endDate.setMonth(today.getMonth() + 1);
                else if (member.currentPlan.duration === 'quarterly') endDate.setMonth(today.getMonth() + 3);
                else if (member.currentPlan.duration === 'yearly') endDate.setFullYear(today.getFullYear() + 1);

                member.endDate = endDate;
                await member.save();

                // Trigger AI Recommendation after renewal
                generateRecommendation(memberId).catch(console.error);
                calculateChurnRisk(memberId).catch(console.error);
            }
        }

        res.status(201).json(newPayment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route   POST /api/payments/razorpay/order
// @desc    Create a Razorpay order
// @access  Admin/Staff
router.post('/razorpay/order', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { amount, currency = 'USD' } = req.body;
    try {
        const options = {
            amount: amount * 100, // Razorpay works in subunits (cents/paise)
            currency,
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        res.status(500).json({ message: 'Razorpay order creation failed', error: err.message });
    }
});

// @route   POST /api/payments/razorpay/verify
// @desc    Verify Razorpay payment signature
// @access  Admin/Staff
router.post('/razorpay/verify', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        memberId,
        planId,
        amount
    } = req.body;

    try {
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment verified
            const newPayment = new Payment({
                member: memberId,
                plan: planId,
                amount,
                transactionId: razorpay_payment_id,
                paymentMethod: 'razorpay',
                status: 'Paid',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id
            });

            await newPayment.save();

            // Update member status
            const member = await Member.findById(memberId).populate('currentPlan');
            if (member && member.currentPlan) {
                const today = new Date();
                member.status = 'Active';
                member.startDate = today;

                const endDate = new Date(today);
                if (member.currentPlan.duration === 'monthly') endDate.setMonth(today.getMonth() + 1);
                else if (member.currentPlan.duration === 'quarterly') endDate.setMonth(today.getMonth() + 3);
                else if (member.currentPlan.duration === 'yearly') endDate.setFullYear(today.getFullYear() + 1);

                member.endDate = endDate;
                await member.save();

                // Trigger AI Recommendation after renewal
                generateRecommendation(memberId).catch(console.error);
                calculateChurnRisk(memberId).catch(console.error);
            }

            return res.json({ message: "Payment verified successfully", payment: newPayment });
        } else {
            return res.status(400).json({ message: "Invalid signature sent!" });
        }
    } catch (err) {
        res.status(500).json({ message: 'Verification failed', error: err.message });
    }
});

module.exports = router;

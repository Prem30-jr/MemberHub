const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { verifyToken, checkRole } = require('../middleware/auth');

// @route   GET /api/plans
// @desc    Get all active plans
// @access  Public (or Staff/Admin)
router.get('/', async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({ isActive: true });
        console.log(`[API] Fetched ${plans.length} active plans`);
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/plans
// @desc    Create a new plan
// @access  Admin only
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    const { name, price, duration, description } = req.body;
    try {
        const newPlan = new SubscriptionPlan({ name, price, duration, description });
        await newPlan.save();
        res.status(201).json(newPlan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PATCH /api/plans/:id
// @desc    Update a plan
// @access  Admin only
router.patch('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedPlan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/plans/:id
// @desc    Delete (deactivate) a plan
// @access  Admin only
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        // We soft delete by setting isActive to false
        const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json({ message: 'Plan deactivated successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;

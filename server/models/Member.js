const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    personalInfo: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phone: { type: String },
        address: { type: String }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    firebaseUid: {
        type: String,
        unique: true,
        sparse: true // Allows null/missing for staff
    },
    password: {
        type: String,
        select: false // Don't return by default
    },
    role: {
        type: String,
        enum: ['admin', 'staff', 'user'],
        default: 'user'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    },
    currentPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan'
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Suspended'],
        default: 'Active'
    },
    payerCategory: {
        type: String,
        enum: ['Regular', 'Late', 'Irregular', 'Unknown'],
        default: 'Unknown'
    },
    lastReminderSentAt: {
        type: Date
    },
    recommendation: {
        plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
        reason: { type: String },
        confidenceScore: { type: Number },
        generatedAt: { type: Date, default: Date.now }
    },
    churnRisk: {
        level: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
        score: { type: Number, default: 0 },
        reasons: [{ type: String }],
        lastCalculated: { type: Date }
    },
    smartMessage: {
        content: { type: String },
        generatedAt: { type: Date }
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Hashing staff passwords before save
memberSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    try {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// Virtual for payment history to avoid double-storing
memberSchema.virtual('paymentHistory', {
    ref: 'Payment',
    localField: '_id',
    foreignField: 'member',
    justOne: false
});

// Indexing for search and status filtering (unique already handles main fields)
memberSchema.index({ status: 1 });
memberSchema.index({ 'personalInfo.lastName': 1 });
memberSchema.index({ role: 1 });

module.exports = mongoose.model('Member', memberSchema);

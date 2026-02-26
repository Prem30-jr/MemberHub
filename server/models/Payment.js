const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: [true, 'Member reference is required']
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: [true, 'Plan reference is required']
    },
    amount: {
        type: Number,
        required: [true, 'Payment amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Overdue'],
        default: 'Pending'
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    paymentMethod: {
        type: String,
        enum: ['manual', 'razorpay'],
        default: 'manual'
    },
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for reporting and tracking
paymentSchema.index({ member: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        unique: true,
        trim: true
    },
    duration: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        required: [true, 'Plan duration is required']
    },
    price: {
        type: Number,
        required: [true, 'Plan price is required'],
        min: [0, 'Price cannot be negative']
    },
    description: {
        type: String,
        required: [true, 'Plan description is required']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexing is handled by unique: true
module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

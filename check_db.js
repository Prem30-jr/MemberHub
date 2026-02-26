const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = 'Your_mongo_url';

const check = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');
        const SubscriptionPlan = mongoose.model('SubscriptionPlan', new mongoose.Schema({ name: String, isActive: Boolean }));
        const plans = await SubscriptionPlan.find({});
        console.log('Total Plans:', plans.length);
        console.log('Plans:', JSON.stringify(plans, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();

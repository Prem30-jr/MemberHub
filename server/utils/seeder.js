const SubscriptionPlan = require('../models/SubscriptionPlan');

const seedPlans = async () => {
    try {
        const activeCount = await SubscriptionPlan.countDocuments({ isActive: true });
        console.log(`[Seeder] Current active plans: ${activeCount}`);
        if (activeCount === 0) {
            console.log('[Seeder] No active plans found. Seeding default plans...');
            const defaultPlans = [
                {
                    name: 'Basic Monthly',
                    price: 29,
                    duration: 'monthly',
                    description: 'Perfect for starters. Access to all basic portal features.',
                    isActive: true
                },
                {
                    name: 'Standard Quarterly',
                    price: 79,
                    duration: 'quarterly',
                    description: 'Best value for growing teams. includes priority support.',
                    isActive: true
                },
                {
                    name: 'Premium Yearly',
                    price: 249,
                    duration: 'yearly',
                    description: 'Ultimate scaling. Full analytics and 24/7 dedicated support.',
                    isActive: true
                }
            ];

            await SubscriptionPlan.insertMany(defaultPlans);
            console.log('[Seeder] Default subscription plans created successfully.');
        } else {
            console.log('[Seeder] Plans already exist, skipping seed.');
        }
    } catch (error) {
        console.error('[Seeder] Error seeding plans:', error);
    }
};

module.exports = { seedPlans };

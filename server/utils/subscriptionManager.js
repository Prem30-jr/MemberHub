const Member = require('../models/Member');

/**
 * Utility to batch check and update expired subscriptions
 */
const updateExpiredSubscriptions = async () => {
    try {
        const today = new Date();

        // Find active members whose end date has passed
        const result = await Member.updateMany(
            {
                status: 'Active',
                endDate: { $lt: today }
            },
            {
                $set: { status: 'Expired' }
            }
        );

        console.log(`[SubscriptionManager] Checked expiries. Updated ${result.modifiedCount} members.`);
    } catch (err) {
        console.error(`[SubscriptionManager] Error updating expiries: ${err.message}`);
    }
};

module.exports = { updateExpiredSubscriptions };

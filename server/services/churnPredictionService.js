const Member = require('../models/Member');
const Payment = require('../models/Payment');

/**
 * AI Logic: Generates a churn risk prediction for a member.
 */
const calculateChurnRisk = async (memberId) => {
    try {
        const member = await Member.findById(memberId).populate('currentPlan');
        if (!member) return null;

        const payments = await Payment.find({ member: memberId, status: 'Paid' }).sort({ paymentDate: 1 });
        const overduePayments = await Payment.find({ member: memberId, status: 'Overdue' });

        let score = 0;
        let reasons = [];

        // Logic 1: 30 days late -> +30 points
        // Simplified by checking if there's any overdue payment logic or expired status
        if (overduePayments.length > 0) {
            score += 30;
            reasons.push("Recent overdue payment");
        }

        // If member is expired by > 30 days
        if (member.endDate && new Date() > member.endDate) {
            const daysSinceExpiry = (new Date() - member.endDate) / (1000 * 60 * 60 * 24);
            if (daysSinceExpiry > 30) {
                if (!reasons.includes("Recent overdue payment")) {
                    score += 30;
                    reasons.push("Subscription gap over 30 days");
                }
            }
        }

        // Logic 2: 2+ missed renewals -> +25 points
        if (overduePayments.length >= 2) {
            score += 25;
            reasons.push("2+ missed renewals");
        }

        // Logic 3: Multiple late payments -> +20 points
        let latePaymentsCount = 0;
        for (let i = 1; i < payments.length; i++) {
            const gap = (payments[i].paymentDate - payments[i - 1].paymentDate) / (1000 * 60 * 60 * 24);
            let expected = 30;
            if (payments[i - 1].plan?.duration === 'quarterly') expected = 90;
            if (payments[i - 1].plan?.duration === 'yearly') expected = 365;

            if (gap > expected + 5) {
                latePaymentsCount++;
            }
        }
        if (latePaymentsCount > 1) {
            score += 20;
            reasons.push("Multiple late payments");
        }

        // Logic 4: Only 1 renewal total -> +15 points
        if (payments.length === 1) {
            score += 15;
            reasons.push("Only 1 renewal total");
        }

        // Logic 5: Consistent on-time renewal -> -20 points
        if (payments.length > 2 && latePaymentsCount === 0 && overduePayments.length === 0) {
            score -= 20;
            reasons.push("Consistent on-time renewal");
        }

        // Ensure score bounds
        if (score < 0) score = 0;

        let level = 'LOW';
        if (score >= 61) level = 'HIGH';
        else if (score >= 31) level = 'MEDIUM';

        member.churnRisk = {
            level,
            score,
            reasons,
            lastCalculated: new Date()
        };

        await member.save();
        return member.churnRisk;

    } catch (error) {
        console.error("Error calculating churn risk for member", memberId, error);
        return null;
    }
};

/**
 * Generates predictions for all active members.
 */
const generateAllChurnPredictions = async () => {
    try {
        const members = await Member.find({ status: { $in: ['Active', 'Expired'] } });
        for (const member of members) {
            await calculateChurnRisk(member._id);
        }
        console.log(`[ChurnPredictionEngine] Generated churn predictions for ${members.length} members.`);
    } catch (err) {
        console.error('Batch churn prediction error:', err);
    }
};

module.exports = {
    calculateChurnRisk,
    generateAllChurnPredictions
};

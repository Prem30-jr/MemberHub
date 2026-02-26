const Member = require('../models/Member');
const Payment = require('../models/Payment');
const SubscriptionPlan = require('../models/SubscriptionPlan');

/**
 * AI Logic: Generates a subscription plan recommendation for a member.
 */
const generateRecommendation = async (memberId) => {
    try {
        const member = await Member.findById(memberId).populate('currentPlan');
        if (!member) return null;

        const payments = await Payment.find({ member: memberId, status: 'Paid' })
            .populate('plan')
            .sort({ paymentDate: -1 });

        const plans = await SubscriptionPlan.find({ isActive: true });

        // Default recommendation if no data
        if (payments.length === 0) {
            const basicPlan = plans.find(p => p.duration === 'monthly') || plans[0];
            member.recommendation = {
                plan: basicPlan?._id,
                reason: "Welcome! We recommend starting with our flexible monthly plan.",
                confidenceScore: 0.8,
                generatedAt: new Date()
            };
            await member.save();
            return member.recommendation;
        }

        let recommendation = {
            plan: null,
            reason: "",
            confidenceScore: 0.5
        };

        const totalRenewals = payments.length;
        const overdueCount = await Payment.countDocuments({ member: memberId, status: 'Overdue' });

        // Logic 1: Late or inconsistent payments -> Recommend Monthly
        if (overdueCount > 2) {
            const monthlyPlan = plans.find(p => p.duration === 'monthly');
            recommendation.plan = monthlyPlan?._id;
            recommendation.reason = "Based on your payment patterns, a flexible monthly plan might help reduce financial burden.";
            recommendation.confidenceScore = 0.85;
        }
        // Logic 2: Loyal members (many renewals) -> Recommend Premium/Long-term
        else if (totalRenewals >= 6) {
            const yearlyPlan = plans.find(p => p.duration === 'yearly');
            const premiumPlan = plans.sort((a, b) => b.price - a.price)[0];

            recommendation.plan = yearlyPlan?._id || premiumPlan?._id;
            recommendation.reason = `As a loyal member with ${totalRenewals} successful renewals, you could save more with a yearly premium plan.`;
            recommendation.confidenceScore = 0.9;
        }
        // Logic 3: Frequent short-term renewals -> Recommend Quarterly/Yearly
        else if (totalRenewals >= 3 && member.currentPlan?.duration === 'monthly') {
            const quarterlyPlan = plans.find(p => p.duration === 'quarterly');
            recommendation.plan = quarterlyPlan?._id;
            recommendation.reason = "You've been renewing monthly. Switching to a quarterly plan could save you effort and cost.";
            recommendation.confidenceScore = 0.75;
        }
        // Logic 4: Irregular users (calculated by status or inactivity)
        else if (member.status === 'Suspended' || member.status === 'Expired') {
            const basicPlan = plans.sort((a, b) => a.price - b.price)[0];
            recommendation.plan = basicPlan?._id;
            recommendation.reason = "We've noticed some irregularities. A basic plan might be the best way to stay connected.";
            recommendation.confidenceScore = 0.7;
        }
        // Fallback: Stay on current tier or suggest next best
        else {
            recommendation.plan = member.currentPlan?._id || plans[0]?._id;
            recommendation.reason = "Your current plan seems to be a good fit for your usage.";
            recommendation.confidenceScore = 0.6;
        }

        // Finalize and save
        member.recommendation = {
            plan: recommendation.plan,
            reason: recommendation.reason,
            confidenceScore: recommendation.confidenceScore,
            generatedAt: new Date()
        };

        await member.save();
        return member.recommendation;
    } catch (err) {
        console.error('Recommendation generation error:', err);
        return null;
    }
};

/**
 * Generates recommendations for all active members.
 */
const generateAllRecommendations = async () => {
    try {
        const members = await Member.find({ status: 'Active' });
        for (const member of members) {
            await generateRecommendation(member._id);
        }
        console.log(`[RecommendationEngine] Generated recommendations for ${members.length} members.`);
    } catch (err) {
        console.error('Batch recommendation error:', err);
    }
};

module.exports = {
    generateRecommendation,
    generateAllRecommendations
};

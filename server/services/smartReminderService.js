const Member = require('../models/Member');
const Payment = require('../models/Payment');
const admin = require('firebase-admin');

/**
 * AI/ML Logic: Classifies a member based on their payment behavior.
 * Uses rule-based scoring as requested.
 */
const classifyMember = async (member) => {
    try {
        // Fetch all successful payments for this member, sorted by date
        const payments = await Payment.find({ member: member._id, status: 'Paid' })
            .populate('plan')
            .sort({ paymentDate: 1 });

        if (payments.length <= 1) return 'Regular'; // Not enough data, assume Regular

        let latePayments = 0;
        let totalPayments = payments.length;

        // Check for 'Overdue' status history if available
        const overdueCount = await Payment.countDocuments({ member: member._id, status: 'Overdue' });

        // Behavior detection
        if (overdueCount > 3) return 'Irregular';
        if (overdueCount > 0) return 'Late';

        // Check for "Renewal History" gaps (heuristic)
        // If a member has many payments but they are spaced out much longer than the plan duration
        for (let i = 1; i < payments.length; i++) {
            const prevPayment = payments[i - 1];
            const currentPayment = payments[i];
            const gapDays = (currentPayment.paymentDate - prevPayment.paymentDate) / (1000 * 60 * 60 * 24);

            let expectedDays = 30; // default monthly
            if (prevPayment.plan?.duration === 'quarterly') expectedDays = 90;
            if (prevPayment.plan?.duration === 'yearly') expectedDays = 365;

            if (gapDays > expectedDays + 5) { // Paid more than 5 days late
                latePayments++;
            }
        }

        const lateRatio = latePayments / (totalPayments - 1);

        if (lateRatio > 0.5) return 'Late';
        if (lateRatio > 0.2) return 'Irregular';

        return 'Regular';
    } catch (err) {
        console.error('Classification error:', err);
        return 'Regular';
    }
};

/**
 * Determines the reminder window based on category.
 */
const getReminderSettings = (category) => {
    switch (category) {
        case 'Regular':
            return { daysBefore: [2], label: 'Regular Payer' };
        case 'Late':
            return { daysBefore: [7, 5], label: 'Late Payer' };
        case 'Irregular':
            return { daysBefore: [10, 7, 3, 1], label: 'Irregular Payer' };
        default:
            return { daysBefore: [2], label: 'Unknown' };
    }
};

/**
 * Sends FCM notification to a member.
 */
const sendNotification = async (member, message) => {
    try {
        // In a real scenario, we'd have member.fcmToken.
        // For this task, we'll log it and attempt to send if token exists.
        console.log(`[SmartReminder] Sending notification to ${member.email}: ${message}`);

        if (member.fcmToken) {
            const payload = {
                notification: {
                    title: 'Membership Renewal',
                    body: message
                },
                token: member.fcmToken
            };
            await admin.messaging().send(payload);
        } else {
            console.log(`[SmartReminder] No FCM token for ${member.email}, skipping push notification.`);
        }

        member.lastReminderSentAt = new Date();
        await member.save();
    } catch (err) {
        console.error(`[SmartReminder] Failed to send notification to ${member.email}:`, err.message);
    }
};

/**
 * Main process: Analyzes all members and sends reminders if needed.
 */
const processSmartReminders = async () => {
    try {
        console.log('[SmartReminder] Starting daily reminder process...');
        const members = await Member.find({ status: 'Active' }).populate('currentPlan');
        const today = new Date();

        for (const member of members) {
            if (!member.endDate) continue;

            // 1. Update classification
            const category = await classifyMember(member);
            member.payerCategory = category;
            await member.save();

            // 2. Check if reminder is due
            const settings = getReminderSettings(category);
            const daysToExpiry = Math.ceil((member.endDate - today) / (1000 * 60 * 60 * 24));

            if (settings.daysBefore.includes(daysToExpiry)) {
                // Avoid double sending on the same day if process runs multiple times
                const lastSent = member.lastReminderSentAt;
                if (!lastSent || lastSent.toDateString() !== today.toDateString()) {
                    await sendNotification(
                        member,
                        `Your ${member.currentPlan?.name || 'membership'} is expiring in ${daysToExpiry} days. Please renew to continue uninterrupted access.`
                    );
                }
            }
        }
        console.log('[SmartReminder] Finished daily reminder process.');
    } catch (err) {
        console.error('[SmartReminder] Process error:', err);
    }
};

module.exports = {
    processSmartReminders,
    classifyMember
};

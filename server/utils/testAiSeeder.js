const mongoose = require('mongoose');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { generateRecommendation } = require('../services/recommendationService');
const { classifyMember } = require('../services/smartReminderService');

const seedTestScenarios = async () => {
    try {
        console.log('--- Starting AI Test Scenario Seeding ---');

        // 1. Get Plans
        const plans = await SubscriptionPlan.find();
        const monthly = plans.find(p => p.duration === 'monthly');
        const quarterly = plans.find(p => p.duration === 'quarterly');
        const yearly = plans.find(p => p.duration === 'yearly');

        // Cleanup existing test members
        await Member.deleteMany({ email: /test_.*@example\.com/ });

        const createTestData = async (name, email, paymentCount, overdueCount = 0) => {
            const member = new Member({
                personalInfo: { firstName: name, lastName: 'Tester' },
                email: email,
                firebaseUid: `test_uid_${Date.now()}_${Math.random()}`,
                currentPlan: monthly._id,
                status: 'Active',
                endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // Expiring in 5 days
            });
            await member.save();

            // Create payments
            for (let i = 0; i < paymentCount; i++) {
                const status = (i < overdueCount) ? 'Overdue' : 'Paid';
                const pDate = new Date();
                pDate.setMonth(pDate.getMonth() - (paymentCount - i));

                await Payment.create({
                    member: member._id,
                    plan: monthly._id,
                    amount: monthly.price,
                    status: status,
                    paymentDate: pDate,
                    transactionId: `TXN_${member._id}_${i}`
                });
            }

            // Trigger AI manually for the first time
            const category = await classifyMember(member);
            member.payerCategory = category;
            await member.save();
            await generateRecommendation(member._id);

            console.log(`Created ${name}: Category=${category}`);
        };

        // Scenario 1: Regular Payer (3 payments, no overdue)
        await createTestData('Regular Ralph', 'test_ralph@example.com', 3, 0);

        // Scenario 2: Late Payer (1 overdue)
        await createTestData('Late Larry', 'test_larry@example.com', 2, 1);

        // Scenario 3: Loyal Member (7 payments, clean record)
        await createTestData('Loyal Laura', 'test_laura@example.com', 7, 0);

        // Scenario 4: Irregular Payer (Multiple overdue)
        await createTestData('Irregular Iris', 'test_iris@example.com', 5, 3);

        console.log('--- Test Scenario Seeding Complete ---');
        console.log('Refresh your dashboard and members page to see the results!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

// Connect and Seed
require('dotenv').config({ path: '../.env' });
const connectDB = require('../config/db');
connectDB().then(seedTestScenarios);

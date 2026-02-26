require('dotenv').config({ path: '../.env' });
const app = require('./app');
const connectDB = require('./config/db');
const cron = require('node-cron');
const { updateExpiredSubscriptions } = require('./utils/subscriptionManager');
const { processSmartReminders } = require('./services/smartReminderService');
const { generateAllRecommendations } = require('./services/recommendationService');
const { generateAllChurnPredictions } = require('./services/churnPredictionService');
const { seedPlans } = require('./utils/seeder');

connectDB().then(async () => {
    // Seed default plans if none exist
    await seedPlans();

    // Run initial checks on startup
    console.log('[Startup] Running initial subscription, reminder and recommendation checks...');
    await updateExpiredSubscriptions();
    await processSmartReminders();
    await generateAllRecommendations();
    await generateAllChurnPredictions();

    // Schedule daily tasks (Every day at midnight)
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Running daily maintenance tasks...');
        await updateExpiredSubscriptions();
        await processSmartReminders();
        await generateAllRecommendations();
        await generateAllChurnPredictions();
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
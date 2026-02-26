const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/subscription_db';

async function dropIndex() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('payments');

        // List all indexes
        const indexes = await collection.listIndexes().toArray();
        console.log('Current indexes:', indexes.map(i => i.name));

        if (indexes.some(i => i.name === 'transactionId_1')) {
            await collection.dropIndex('transactionId_1');
            console.log('Dropped index transactionId_1');
        } else {
            console.log('Index transactionId_1 not found');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

dropIndex();

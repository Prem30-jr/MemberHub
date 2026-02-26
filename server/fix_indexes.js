const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to:', mongoose.connection.name);
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        for (const colInfo of collections) {
            const collection = db.collection(colInfo.name);
            const indexes = await collection.listIndexes().toArray();
            console.log(`Collection: ${colInfo.name}`);
            console.log(`  Indexes:`, indexes.map(i => i.name));

            const target = indexes.find(i => i.name === 'transactionId_1' || i.key.transactionId);
            if (target) {
                console.log(`  Target index found: ${target.name}. Dropping...`);
                await collection.dropIndex(target.name);
                console.log(`  Dropped successfully.`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();

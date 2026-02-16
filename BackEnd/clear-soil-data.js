import mongoose from 'mongoose';
import { SoilData } from './src/models/SoilData.model.js';
import { env } from './src/config/env.js';

console.log('🗑️  Clearing all soil data...');

try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all soil data
    const result = await SoilData.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} soil data records`);

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

    process.exit(0);
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

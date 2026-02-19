import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { SoilData } from '../models/SoilData.model.js';

// Generate realistic fake soil data for December 2025 (10 days)
const generateFakeSoilData = (deviceId, count = 10) => {
  const data = [];
  // Start from December 20, 2025 and go forward 10 days
  const startDate = new Date('2025-12-20T08:00:00.000Z');
  
  for (let i = 0; i < count; i++) {
    // Generate timestamp for each day going forward from Dec 20, 2025
    const timestamp = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
    
    data.push({
      deviceId,
      moisture: Math.round((Math.random() * 40 + 30) * 100) / 100, // 30-70%
      temperature: Math.round((Math.random() * 15 + 15) * 100) / 100, // 15-30°C
      temp: Math.round((Math.random() * 15 + 15) * 100) / 100, // duplicate field for dashboard compatibility
      pH: Math.round((Math.random() * 2 + 6) * 100) / 100, // 6.0-8.0
      nitrogen: Math.round(Math.random() * 150 + 50), // 50-200 mg/kg
      phosphorus: Math.round(Math.random() * 80 + 20), // 20-100 mg/kg
      potassium: Math.round(Math.random() * 200 + 100), // 100-300 mg/kg
      sulfur: Math.round(Math.random() * 30 + 10), // 10-40 mg/kg
      zinc: Math.round(Math.random() * 5 + 1), // 1-6 mg/kg
      iron: Math.round(Math.random() * 50 + 10), // 10-60 mg/kg
      manganese: Math.round(Math.random() * 20 + 5), // 5-25 mg/kg
      copper: Math.round(Math.random() * 10 + 2), // 2-12 mg/kg
      calcium: Math.round(Math.random() * 2000 + 1000), // 1000-3000 mg/kg
      magnesium: Math.round(Math.random() * 500 + 200), // 200-700 mg/kg
      sodium: Math.round(Math.random() * 100 + 20), // 20-120 mg/kg
      timestamp,
    });
  }
  
  return data;
};

// Seed data for multiple devices (matching dashboard expectations)
const seedSoilData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing soil data
    await SoilData.deleteMany({});
    console.log('Cleared existing soil data');

    // Device IDs to generate data for (matching dashboard expectations)
    const deviceIds = [
      'DEVICE001',  // Main device for dashboard
      'DEVICE002', 
      'DEVICE003',
      'DEVICE004',
      'DEVICE005'
    ];

    // Generate and insert data for each device
    for (const deviceId of deviceIds) {
      const fakeData = generateFakeSoilData(deviceId, 10); // 10 records per device (Dec 20-29, 2025)
      await SoilData.insertMany(fakeData);
      console.log(`Inserted ${fakeData.length} records for device: ${deviceId}`);
    }

    // Get total count
    const totalRecords = await SoilData.countDocuments();
    console.log(`\n✅ Successfully seeded ${totalRecords} soil data records!`);
    
    // Show sample data
    const sampleData = await SoilData.findOne().lean();
    console.log('\n📊 Sample record:', sampleData);

  } catch (error) {
    console.error('❌ Error seeding soil data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the seeding
seedSoilData();

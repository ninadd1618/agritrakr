import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { SoilData } from '../models/SoilData.model.js';
import { FinalData } from '../models/FinalData.model.js';

// Generate realistic fake soil data
const generateFakeSoilData = (deviceId, count = 100) => {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Generate timestamp for each hour going back
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    
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

// Generate fake OEE/PLC data
const generateFakeFinalData = (deviceId, count = 100) => {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Generate timestamp for each hour going back
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    
    data.push({
      deviceId,
      oee: Math.round((Math.random() * 30 + 60) * 100) / 100, // 60-90%
      availability: Math.round((Math.random() * 20 + 75) * 100) / 100, // 75-95%
      performance: Math.round((Math.random() * 25 + 70) * 100) / 100, // 70-95%
      quality: Math.round((Math.random() * 15 + 85) * 100) / 100, // 85-100%
      timestamp,
    });
  }
  
  return data;
};

// Main seeding function
const seedAllData = async () => {
  try {
    console.log('🌱 Starting data seeding process...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await SoilData.deleteMany({});
    await FinalData.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Device IDs to generate data for (matching dashboard expectations)
    const soilDeviceIds = [
      'DEVICE001',  // Main device for dashboard
      'DEVICE002', 
      'DEVICE003',
      'DEVICE004',
      'DEVICE005'
    ];

    const oeeDeviceIds = [
      'OEE_DEVICE_001',
      'OEE_DEVICE_002',
      'OEE_DEVICE_003'
    ];

    // Generate and insert soil data
    console.log('\n📊 Seeding soil nutrients data...');
    let totalSoilRecords = 0;
    for (const deviceId of soilDeviceIds) {
      const fakeData = generateFakeSoilData(deviceId, 168); // 1 week of hourly data
      await SoilData.insertMany(fakeData);
      totalSoilRecords += fakeData.length;
      console.log(`  ✅ Inserted ${fakeData.length} records for ${deviceId}`);
    }

    // Generate and insert OEE data
    console.log('\n⚙️ Seeding OEE/PLC data...');
    let totalOeeRecords = 0;
    for (const deviceId of oeeDeviceIds) {
      const fakeData = generateFakeFinalData(deviceId, 168); // 1 week of hourly data
      await FinalData.insertMany(fakeData);
      totalOeeRecords += fakeData.length;
      console.log(`  ✅ Inserted ${fakeData.length} records for ${deviceId}`);
    }

    // Summary
    console.log('\n🎉 Seeding completed successfully!');
    console.log(`📈 Total soil nutrients records: ${totalSoilRecords}`);
    console.log(`⚙️ Total OEE records: ${totalOeeRecords}`);
    console.log(`📊 Total records: ${totalSoilRecords + totalOeeRecords}`);

    // Show sample data
    const sampleSoil = await SoilData.findOne().lean();
    const sampleOee = await FinalData.findOne().lean();
    
    console.log('\n🌱 Sample soil record:', {
      deviceId: sampleSoil.deviceId,
      nitrogen: sampleSoil.nitrogen,
      phosphorus: sampleSoil.phosphorus,
      potassium: sampleSoil.potassium,
      pH: sampleSoil.pH,
      timestamp: sampleSoil.timestamp
    });
    
    console.log('\n⚙️ Sample OEE record:', {
      deviceId: sampleOee.deviceId,
      oee: sampleOee.oee,
      availability: sampleOee.availability,
      performance: sampleOee.performance,
      quality: sampleOee.quality,
      timestamp: sampleOee.timestamp
    });

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
};

// Run the seeding
seedAllData();

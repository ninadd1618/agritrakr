import mongoose from 'mongoose';
import { FinalData } from './src/models/FinalData.model.js';
import { SoilData } from './src/models/SoilData.model.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for seeding');
    } catch (error) {
        console.error('MongoDB Error:', error);
        process.exit(1);
    }
};

// Generate random data within realistic ranges
const randomInRange = (min, max) => Math.random() * (max - min) + min;

// Generate timestamps for January 1 - February 20, 2026 (51 days)
const generateTimestamps = (count) => {
    const timestamps = [];
    const startDate = new Date('2026-01-01T00:00:00.000Z');
    const endDate = new Date('2026-02-20T23:59:59.000Z');

    for (let i = 0; i < count; i++) {
        const randomTime = new Date(
            startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
        );
        timestamps.push(randomTime);
    }

    return timestamps.sort((a, b) => a - b);
};

// Generate OEE/Final Data
const generateFinalData = () => {
    const devices = ['DEVICE001', 'DEVICE002', 'DEVICE003', 'DEVICE004', 'DEVICE005'];
    const data = [];
    const timestamps = generateTimestamps(200); // 200 data points

    timestamps.forEach((timestamp, index) => {
        const deviceId = devices[index % devices.length];

        // Generate realistic OEE metrics (0-100)
        const availability = randomInRange(75, 98);
        const performance = randomInRange(70, 95);
        const quality = randomInRange(80, 99);
        const oee = (availability * performance * quality) / 10000;

        data.push({
            deviceId,
            timestamp,
            oee: Number(oee.toFixed(2)),
            availability: Number(availability.toFixed(2)),
            performance: Number(performance.toFixed(2)),
            quality: Number(quality.toFixed(2)),
        });
    });

    return data;
};

// Generate Soil Data
const generateSoilData = () => {
    // Match the deviceIds that frontend is looking for
    const devices = ['DEVICE001', 'DEVICE002', 'DEVICE003', 'DEVICE004'];
    const data = [];
    const timestamps = generateTimestamps(150); // 150 data points

    timestamps.forEach((timestamp, index) => {
        const deviceId = devices[index % devices.length];

        const temperature = Number(randomInRange(15, 35).toFixed(2));
        data.push({
            deviceId,
            timestamp,
            moisture: Number(randomInRange(30, 70).toFixed(2)), // 30-70%
            temperature: temperature, // 15-35°C
            temp: temperature, // Same as temperature for compatibility
            pH: Number(randomInRange(5.5, 8.0).toFixed(2)), // 5.5-8.0
            nitrogen: Number(randomInRange(20, 80).toFixed(2)), // 20-80 ppm
            phosphorus: Number(randomInRange(15, 70).toFixed(2)), // 15-70 ppm
            potassium: Number(randomInRange(100, 300).toFixed(2)), // 100-300 ppm
            sulfur: Number(randomInRange(10, 60).toFixed(2)), // 10-60 ppm
            zinc: Number(randomInRange(5, 50).toFixed(2)), // 5-50 ppm
            iron: Number(randomInRange(10, 80).toFixed(2)), // 10-80 ppm
            manganese: Number(randomInRange(5, 60).toFixed(2)), // 5-60 ppm
            copper: Number(randomInRange(2, 30).toFixed(2)), // 2-30 ppm
            calcium: Number(randomInRange(200, 500).toFixed(2)), // 200-500 ppm
            magnesium: Number(randomInRange(50, 150).toFixed(2)), // 50-150 ppm
            sodium: Number(randomInRange(10, 100).toFixed(2)), // 10-100 ppm
        });
    });

    return data;
};

// Seed the database
const seedDatabase = async () => {
    try {
        await connectDB();

        console.log('Clearing existing data...');
        await FinalData.deleteMany({});
        await SoilData.deleteMany({});

        console.log('Generating and inserting Final/OEE data...');
        const finalData = generateFinalData();
        await FinalData.insertMany(finalData);
        console.log(`✓ Inserted ${finalData.length} Final/OEE records`);

        console.log('Generating and inserting Soil data...');
        const soilData = generateSoilData();
        await SoilData.insertMany(soilData);
        console.log(`✓ Inserted ${soilData.length} Soil records`);

        console.log('\n🎉 Database seeded successfully!');
        console.log(`Total records: ${finalData.length + soilData.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();

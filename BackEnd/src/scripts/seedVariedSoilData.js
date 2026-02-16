import mongoose from 'mongoose';
import { SoilData } from '../models/SoilData.model.js';
import { env } from '../config/env.js';

// Connect to MongoDB
await mongoose.connect(env.MONGODB_URI);

console.log('✅ Connected to MongoDB');

// Clear existing soil data
await SoilData.deleteMany({});
console.log('🗑️  Cleared existing soil data');

// Generate varied soil data with realistic variations
const generateVariedSoilData = () => {
    const data = [];
    const startDate = new Date('2025-12-01');
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        // Generate values with realistic variations (70-130% of ideal values)
        const variation = () => 0.7 + Math.random() * 0.6; // Random between 0.7 and 1.3
        
        data.push({
            deviceId: 'sensor-001',
            timestamp: date,
            moisture: 45 + Math.random() * 10, // 45-55%
            pH: 6.3 + Math.random() * 0.6, // 6.3-6.9
            temp: 18 + Math.random() * 6, // 18-24°C
            temperature: 18 + Math.random() * 6, // Required field
            nitrogen: Math.round(50 * variation()), // Required field - varies around 50
            // Macro nutrients with variations
            phosphorus: Math.round(70 * variation()), // varies around 70
            potassium: Math.round(210 * variation()), // varies around 210
            calcium: Math.round(1800 * variation()), // varies around 1800
            magnesium: Math.round(280 * variation()), // varies around 280
            sulfur: Math.round(60 * variation()), // varies around 60
            // Micro nutrients with variations
            iron: Math.round(60 * variation()),
            manganese: Math.round(60 * variation()),
            zinc: Math.round(60 * variation()),
            copper: Math.round(60 * variation()),
            sodium: Math.round(30 * variation())
        });
    }
    
    return data;
};

// Insert new varied data
const variedData = generateVariedSoilData();
await SoilData.insertMany(variedData);

console.log(`✅ Inserted ${variedData.length} varied soil data records`);
console.log('📊 Sample data:');
console.log('   Phosphorus range:', Math.min(...variedData.map(d => d.phosphorus)), '-', Math.max(...variedData.map(d => d.phosphorus)));
console.log('   Potassium range:', Math.min(...variedData.map(d => d.potassium)), '-', Math.max(...variedData.map(d => d.potassium)));
console.log('   Calcium range:', Math.min(...variedData.map(d => d.calcium)), '-', Math.max(...variedData.map(d => d.calcium)));
console.log('   Magnesium range:', Math.min(...variedData.map(d => d.magnesium)), '-', Math.max(...variedData.map(d => d.magnesium)));
console.log('   Sulfur range:', Math.min(...variedData.map(d => d.sulfur)), '-', Math.max(...variedData.map(d => d.sulfur)));

await mongoose.connection.close();
console.log('👋 Disconnected from MongoDB');

import mqtt from 'mqtt';
import axios from 'axios';
import { appLogger } from './src/config/logger.js';

// MQTT Broker settings (same as MQTT Explorer)
const MQTT_BROKER = 'mqtt://broker.hivemq.com:1883';
const MQTT_TOPIC = 'flowmen/sensors/+/soil';  // + is wildcard for device ID

// Your backend API URL
const API_URL = 'http://localhost:4000/api/v1/soil/data';

console.log('🔌 Starting MQTT Bridge...');
console.log(`📡 Connecting to MQTT broker: ${MQTT_BROKER}`);
console.log(`📝 Subscribing to topic: ${MQTT_TOPIC}`);
console.log(`🎯 Forwarding to API: ${API_URL}`);

// Connect to MQTT broker
const client = mqtt.connect(MQTT_BROKER, {
    clientId: 'flowmen-mqtt-bridge-' + Math.random().toString(16).substr(2, 8),
    clean: true,
    reconnectPeriod: 5000,
});

client.on('connect', () => {
    console.log('✅ Connected to MQTT broker!');

    // Subscribe to sensor topics
    client.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
            console.error('❌ Subscription error:', err);
        } else {
            console.log(`✅ Subscribed to: ${MQTT_TOPIC}`);
            console.log('\n📨 Waiting for messages...\n');
        }
    });
});

client.on('message', async (topic, message) => {
    try {
        console.log(`\n📥 Received message on topic: ${topic}`);

        // Extract device ID from topic (e.g., flowmen/sensors/ESP32-001/soil)
        const topicParts = topic.split('/');
        const deviceId = topicParts[2] || 'unknown';

        // Parse the MQTT message
        const messageStr = message.toString();
        console.log(`📄 Raw message: ${messageStr}`);

        let sensorData;
        try {
            sensorData = JSON.parse(messageStr);
        } catch (e) {
            console.error('❌ Invalid JSON message');
            return;
        }

        // Transform MQTT data to API format
        const payload = {
            deviceId: sensorData.deviceId || deviceId,
            moisture: parseFloat(sensorData.moisture || sensorData.m || 0),
            temperature: parseFloat(sensorData.temperature || sensorData.t || 0),
            pH: parseFloat(sensorData.pH || sensorData.ph || 7.0),
            nitrogen: parseFloat(sensorData.nitrogen || sensorData.n || 100),
            phosphorus: parseFloat(sensorData.phosphorus || sensorData.p || 50),
            potassium: parseFloat(sensorData.potassium || sensorData.k || 150),
        };

        console.log('🔄 Transformed payload:', JSON.stringify(payload, null, 2));

        // Send to your backend API
        const response = await axios.post(API_URL, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
        });

        console.log(`✅ Data forwarded successfully! Status: ${response.status}`);
        console.log(`💾 Stored in database for device: ${payload.deviceId}`);

    } catch (error) {
        if (error.response) {
            console.error(`❌ API Error ${error.response.status}:`, error.response.data);
        } else if (error.request) {
            console.error('❌ Network error - API not reachable');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
});

client.on('error', (error) => {
    console.error('❌ MQTT Error:', error.message);
});

client.on('offline', () => {
    console.log('⚠️  MQTT client offline - attempting to reconnect...');
});

client.on('reconnect', () => {
    console.log('🔄 Reconnecting to MQTT broker...');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down MQTT bridge...');
    client.end();
    process.exit(0);
});

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        // Use MONGODB_URI directly - it already includes the database name
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`\nMongoDB connected! Host: ${connectionInstance.connection.host}`);
        console.log(`Database: ${connectionInstance.connection.name}`);
    } catch (error) {
        console.error("MONGODB connection error:", error);
        process.exit(1);
    }
};

module.exports = connectDB;

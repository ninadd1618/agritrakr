import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async () => {
  try {
    // Validate MongoDB URI
    if (!env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('🔗 URI:', env.MONGODB_URI.replace(/:([^:@]+)@/, ':***@')); // Hide password

    // Connection options for Atlas
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    };

    const conn = await mongoose.connect(env.MONGODB_URI, options);

    console.log("✅ MongoDB Connected:", conn.connection.name);
    console.log("🌐 Host:", conn.connection.host);
    
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error("💡 Possible causes:");
      console.error("   - Invalid cluster URL in MongoDB URI");
      console.error("   - Network connectivity issues");
      console.error("   - DNS resolution problems");
    } else if (error.message.includes('authentication')) {
      console.error("💡 Possible causes:");
      console.error("   - Invalid username or password");
      console.error("   - User doesn't have database access");
      console.error("   - IP not whitelisted in Atlas");
    } else if (error.message.includes('bad auth')) {
      console.error("💡 Authentication failed - check username/password");
    }
    
    process.exit(1);
  }
};

export default connectDB;

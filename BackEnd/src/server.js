import dotenv from 'dotenv';
import { app } from './app.js';
import connectDB from './config/db.js';
import { appLogger } from './config/logger.js';
import { env } from './config/env.js';

dotenv.config();

// Render provides PORT env var, use it if available
const PORT = process.env.PORT || env.PORT || 4000;

console.log("ENV CHECK:", {
  PORT,
  MONGO: process.env.MONGODB_URI ? "SET" : "NOT SET"
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      appLogger.info(`⚙️ Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    appLogger.error("MONGO db connection FAILED !!!", err);
    process.exit(1);
  });
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    // Skip if already connected
    if (mongoose.connection.readyState === 1) {
      console.log("🔹 Using existing MongoDB connection...");
      return mongoose.connection;
    }

    const connectionString =
      process.env.NODE_ENV === "test"
        ? process.env.TEST_MONGO_URI
        : process.env.MONGO_URI;

    if (!connectionString) {
      throw new Error("MongoDB connection string is missing in environment variables!");
    }

    // Establish new connection if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(connectionString);
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    }

    return mongoose.connection;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1); // Exit only in production
    }
    throw error;
  }
};

// ✅ Function to close all connections (used in tests)
export const closeDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      console.log("🔹 Closing MongoDB connection...");
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed!");
    }
  } catch (error) {
    console.error("❌ Error closing database:", error.message);
    throw error;
  }
};

export default connectDB;

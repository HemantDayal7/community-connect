import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // ✅ Ensure .env is loaded

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI; // ✅ Fetch from environment

    if (!mongoURI) {
      throw new Error("❌ MONGO_URI is not defined. Check your .env file.");
    }

    await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

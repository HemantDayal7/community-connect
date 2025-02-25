import dotenv from "dotenv";

dotenv.config(); // ✅ Ensure environment variables are loaded

export const envConfig = {
  PORT: process.env.PORT || 5050,
  MONGO_URI: process.env.MONGO_URI, // ✅ Fix: Ensure it's fetched properly
  JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
};

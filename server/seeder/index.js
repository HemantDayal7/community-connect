import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import seedUsers from "./userSeeder.js";
import seedEvents from "./eventSeeder.js";
import seedResources from "./resourceSeeder.js";
import seedSkills from "./skillSeeder.js";

dotenv.config();

// ✅ Seed All Data
const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected...");

    await seedUsers();
    await seedEvents();
    await seedResources();
    await seedSkills();

    console.log("✅ Database Seeded Successfully!");
    process.exit(); // Exit after completion
  } catch (error) {
    console.error("❌ Seeding Failed:", error.message);
    process.exit(1);
  }
};

// Execute Seeding
seedDatabase();

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const logger = require("./logger"); // ✅ Import logger utility

const User = require("../models/User");
const Event = require("../models/Event");
const Resource = require("../models/Resource");
const Message = require("../models/Message");
const HelpRequest = require("../models/HelpRequest");
const SkillSharing = require("../models/SkillSharing");

// ✅ Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("❌ MONGO_URI is missing in .env file.");
    }
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("✅ MongoDB Connected...");
  } catch (error) {
    logger.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

// ✅ Seed Data
const seedDatabase = async () => {
  try {
    logger.info("🔄 Resetting Database...");

    // **1️⃣ Clear existing data**
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Resource.deleteMany({}),
      Message.deleteMany({}),
      HelpRequest.deleteMany({}),
      SkillSharing.deleteMany({}),
    ]);
    logger.info("✅ Old data removed.");

    // **2️⃣ Hash passwords**
    const hashedPassword1 = await bcrypt.hash("password123", 10);
    const hashedPassword2 = await bcrypt.hash("password456", 10);

    // **3️⃣ Insert sample users**
    const users = await User.insertMany([
      { name: "John Doe", email: "john@example.com", password: hashedPassword1, role: "user" },
      { name: "Alice Smith", email: "alice@example.com", password: hashedPassword2, role: "user" },
    ]);
    logger.info("✅ Users seeded.");

    // **4️⃣ Insert sample events**
    const events = await Event.insertMany([
      { title: "Community Clean-up", date: new Date(), location: "Local Park", hostId: users[0]._id },
    ]);
    logger.info("✅ Events seeded.");

    // **5️⃣ Insert sample resources**
    const resources = await Resource.insertMany([
      { 
        title: "Laptop", 
        description: "Available for study use", 
        ownerId: users[1]._id, 
        availability: "available",  
        location: "Library" 
      },
    ]);
    logger.info("✅ Resources seeded.");

    // **6️⃣ Insert sample help requests**
    const helpRequests = await HelpRequest.insertMany([
      { 
        requesterId: users[0]._id,  // ✅ Fixed missing field
        title: "Need help carrying groceries", // ✅ Added required field
        description: "Looking for someone to help me carry groceries from the store.",
        category: "Errands",  // ✅ Added required field
        location: "Downtown",
        status: "Pending"
      },
    ]);
    logger.info("✅ Help requests seeded.");

    // **7️⃣ Insert sample skill-sharing offers**
    const skillSharings = await SkillSharing.insertMany([
      { 
        userId: users[1]._id, 
        skillName: "Guitar Lessons", 
        description: "Teaching beginner level", 
        availability: "available", 
        location: "Music Studio" 
      },
    ]);
    logger.info("✅ Skill Sharing seeded.");

    logger.info("🎉 Database Seeded Successfully!");

    // Close DB Connection
    mongoose.connection.close();
  } catch (error) {
    logger.error(`❌ Seeding Failed: ${error.message}`);
    mongoose.connection.close();
  }
};

// **Run the Seeder**
connectDB().then(() => seedDatabase());

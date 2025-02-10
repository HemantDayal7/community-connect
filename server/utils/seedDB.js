require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected...");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  }
};

// ✅ Seed Data
const seedDatabase = async () => {
  try {
    console.log("🔄 Resetting Database...");

    // **1️⃣ Clear existing data**
    await User.deleteMany({});
    await Event.deleteMany({});
    await Resource.deleteMany({});
    await Message.deleteMany({});
    await HelpRequest.deleteMany({});
    await SkillSharing.deleteMany({});
    console.log("✅ Old data removed.");

    // **2️⃣ Hash passwords**
    const hashedPassword1 = await bcrypt.hash("password123", 10);
    const hashedPassword2 = await bcrypt.hash("password456", 10);

    // **3️⃣ Insert sample users**
    const users = await User.insertMany([
      { name: "John Doe", email: "john@example.com", password: hashedPassword1, role: "user" },
      { name: "Alice Smith", email: "alice@example.com", password: hashedPassword2, role: "user" },
    ]);
    console.log("✅ Users seeded.");

    // **4️⃣ Insert sample events**
    await Event.insertMany([
      { title: "Community Clean-up", date: new Date(), location: "Local Park", hostId: users[0]._id },
    ]);
    console.log("✅ Events seeded.");

    // **5️⃣ Insert sample resources**
    await Resource.insertMany([
      { 
        title: "Laptop", 
        description: "Available for study use", 
        ownerId: users[1]._id, 
        availability: "available",  // ✅ Fixed enum value
        location: "Library" 
      },
    ]);
    console.log("✅ Resources seeded.");

    // **6️⃣ Insert sample help requests**
    await HelpRequest.insertMany([
      { userId: users[0]._id, description: "Need help with groceries", location: "Downtown", status: "Pending" },
    ]);
    console.log("✅ Help requests seeded.");

    // **7️⃣ Insert sample skill-sharing offers**
    await SkillSharing.insertMany([
      { 
        userId: users[1]._id, 
        skillName: "Guitar Lessons", 
        description: "Teaching beginner level", 
        availability: "available", // ✅ Fixed enum value
        location: "Music Studio" 
      },
    ]);
    console.log("✅ Skill Sharing seeded.");

    console.log("🎉 Database Seeded Successfully!");

    // Close DB Connection
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    mongoose.connection.close();
  }
};

// **Run the Seeder**
connectDB().then(() => seedDatabase());

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readlineSync = require("readline-sync");
const logger = require("./utils/logger"); // ✅ Logger for clean console logs

// Import Models
const User = require("./models/User");
const Event = require("./models/Event");
const Resource = require("./models/Resource");
const Message = require("./models/Message");
const HelpRequest = require("./models/HelpRequest");
const SkillSharing = require("./models/SkillSharing");

// ✅ Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("✅ MongoDB Connected...");
  } catch (error) {
    logger.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

// ✅ Reset and Seed Data
const seedDatabase = async (option) => {
  try {
    logger.info("🔄 Resetting Database...");

    // **1️⃣ Clear Data Based on Option**
    if (option === "1") {
      await User.deleteMany({});
      await Event.deleteMany({});
      await Resource.deleteMany({});
      await Message.deleteMany({});
      await HelpRequest.deleteMany({});
      await SkillSharing.deleteMany({});
      logger.info("✅ Full database reset completed.");
    } else if (option === "2") {
      await User.deleteMany({});
      logger.info("✅ Users collection reset.");
    } else if (option === "3") {
      await Event.deleteMany({});s
      logger.info("✅ Events collection reset.");
    } else if (option === "4") {
      await Resource.deleteMany({});
      logger.info("✅ Resources collection reset.");
    } else if (option === "5") {
      await Message.deleteMany({});
      logger.info("✅ Messages collection reset.");
    } else if (option === "6") {
      await HelpRequest.deleteMany({});
      logger.info("✅ Help Requests collection reset.");
    } else if (option === "7") {
      await SkillSharing.deleteMany({});
      logger.info("✅ Skill Sharing collection reset.");
    } else {
      logger.info("❌ Invalid option. Exiting...");
      process.exit(1);
    }

    // **2️⃣ Hash Passwords**
    const hashedPassword1 = await bcrypt.hash("password123", 10);
    const hashedPassword2 = await bcrypt.hash("password456", 10);

    // **3️⃣ Insert Sample Users**
    const users = await User.insertMany([
      { name: "John Doe", email: "john@example.com", password: hashedPassword1, role: "user" },
      { name: "Alice Smith", email: "alice@example.com", password: hashedPassword2, role: "user" },
    ]);
    logger.info("✅ Users seeded.");

    // **4️⃣ Insert Sample Events**
    await Event.insertMany([
      { title: "Community Clean-up", date: new Date(), location: "Local Park", hostId: users[0]._id },
    ]);
    logger.info("✅ Events seeded.");

    // **5️⃣ Insert Sample Resources**
    await Resource.insertMany([
      { 
        title: "Laptop", 
        description: "Available for study use", 
        ownerId: users[1]._id, 
        availability: "available",
        location: "Library" 
      },
    ]);
    logger.info("✅ Resources seeded.");

    // **6️⃣ Insert Sample Help Requests (✅ FIXED `requesterId`)**
    await HelpRequest.insertMany([
      { 
        requesterId: users[0]._id,  // ✅ FIXED - Changed from `userId` to `requesterId`
        title: "Help with groceries",
        description: "Need assistance carrying groceries.",
        category: "Errands",
        location: "Downtown"
      },
    ]);
    logger.info("✅ Help Requests seeded.");

    // **7️⃣ Insert Sample Skill Sharing**
    await SkillSharing.insertMany([
      { 
        userId: users[1]._id, 
        skillName: "Guitar Lessons", 
        description: "Teaching beginner level", 
        availability: "available",
        location: "Music Studio" 
      },
    ]);
    logger.info("✅ Skill Sharing seeded.");

    logger.info("🎉 Database Seeding Completed Successfully!");

    // Close DB Connection
    mongoose.connection.close();
  } catch (error) {
    logger.error(`❌ Seeding Failed: ${error.message}`);
    mongoose.connection.close();
  }
};

// **Run Seeder with Selection Menu**
const runSeeder = async () => {
  console.log("\n🔄 **Database Seeding Options**");
  console.log("1️⃣ Full Reset (All Data)");
  console.log("2️⃣ Reset Users");
  console.log("3️⃣ Reset Events");
  console.log("4️⃣ Reset Resources");
  console.log("5️⃣ Reset Messages");
  console.log("6️⃣ Reset Help Requests");
  console.log("7️⃣ Reset Skill Sharing");
  console.log("8️⃣ Exit\n");

  const option = readlineSync.question("Select an option: ");

  if (option === "8") {
    console.log("🚪 Exiting seeder...");
    process.exit(0);
  }

  await connectDB();
  await seedDatabase(option);
};

// **Start Seeder**
runSeeder();

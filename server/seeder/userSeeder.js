import User from "../models/User.js";
import bcrypt from "bcryptjs";

const seedUsers = async () => {
  try {
    await User.deleteMany(); // Clear existing users

    const users = [
      {
        name: "Admin User",
        email: "admin@example.com",
        password: bcrypt.hashSync("password123", 10),
        role: "admin",
      },
      {
        name: "John Doe",
        email: "johndoe@example.com",
        password: bcrypt.hashSync("password123", 10),
        role: "user",
      },
      {
        name: "Jane Smith",
        email: "janesmith@example.com",
        password: bcrypt.hashSync("password123", 10),
        role: "user",
      },
    ];

    await User.insertMany(users);
    console.log("✅ Users Seeded!");
  } catch (error) {
    console.error("❌ Error Seeding Users:", error);
  }
};

export default seedUsers;

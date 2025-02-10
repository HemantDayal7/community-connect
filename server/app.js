const express = require("express");
const swaggerSetup = require("./config/swagger");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
app.use(express.json());

// ✅ Debug log - Confirm API server starts
console.log("🚀 Server is starting...");

// Connect to MongoDB
connectDB();

// ✅ Import Routes
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const userRoutes = require("./routes/userRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const helpRequestRoutes = require("./routes/helpRequestRoutes");
const skillSharingRoutes = require("./routes/skillSharingRoutes");
const messagesRoutes = require("./routes/messagesRoutes"); // ✅ New Messages Route

// ✅ Debug logs - Ensure Routes Load
console.log("📌 Registering Routes...");
console.log("➡️ /auth");
console.log("➡️ /events");
console.log("➡️ /users");
console.log("➡️ /resources");
console.log("➡️ /helprequests");
console.log("➡️ /skillsharings");
console.log("➡️ /messages");

// ✅ Register Routes
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);
app.use("/users", userRoutes);
app.use("/resources", resourceRoutes);
app.use("/helprequests", helpRequestRoutes);
app.use("/skillsharings", skillSharingRoutes);
app.use("/messages", messagesRoutes); // ✅ Register Messages Route

// ✅ Setup Swagger Documentation
swaggerSetup(app);

// ✅ Define port from .env or default to 5050
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}/api-docs`));

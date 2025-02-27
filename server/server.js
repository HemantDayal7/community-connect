import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import favicon from "serve-favicon";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import setupSwagger from "./config/swagger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestLogger, errorLogger } from "./middleware/loggingMiddleware.js";
import apiLimiter from "./middleware/rateLimiter.js";

// ✅ Load Environment Variables
dotenv.config();

// ✅ Initialize Express & HTTP Server
const app = express();
const server = http.createServer(app);

// ✅ Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

// ✅ Connect to MongoDB
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// ✅ Middleware (Placed Early for Correct Parsing)
app.use(express.json()); // Handles JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

// ✅ JSON Error Handling Middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ JSON Parsing Error:", err.message);
    return res.status(400).json({ success: false, message: "Invalid JSON format" });
  }
  next(err);
});

// ✅ Security Enhancements
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(requestLogger);
app.use(favicon(path.join(process.cwd(), "public", "favicon.ico")));

// ✅ Apply Rate Limiting
app.use("/api", apiLimiter);

// ✅ Setup API Documentation (Swagger)
setupSwagger(app);

// ✅ Import & Use API Routes
import authRoutes from "./routes/v1/authRoutes.js";
import userRoutes from "./routes/v1/userRoutes.js";
import eventRoutes from "./routes/v1/eventRoutes.js";
import helpRequestRoutes from "./routes/v1/helpRequestRoutes.js";
import messagesRoutes from "./routes/v1/messagesRoutes.js";
import resourceRoutes from "./routes/v1/resourceRoutes.js";
import skillSharingRoutes from "./routes/v1/skillSharingRoutes.js";
import healthCheck from "./routes/v1/healthCheck.js";

// ✅ API Routes
const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}/helprequests`, helpRequestRoutes);
app.use(`${API_PREFIX}/messages`, messagesRoutes);
app.use(`${API_PREFIX}/resources`, resourceRoutes);
app.use(`${API_PREFIX}/skillsharings`, skillSharingRoutes);
app.use(`${API_PREFIX}/health`, healthCheck);

// ✅ Default API Route
app.get(API_PREFIX, (req, res) => {
  res.status(200).json({ message: "🎉 Welcome to the Community Connect API!" });
});

// ✅ Catch Missing Routes
app.use((req, res, next) => {
  console.warn(`⚠️ 404 - Route Not Found: ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `❌ Not Found - ${req.originalUrl}` });
});

// ✅ Error Handling Middleware
app.use(errorLogger);
app.use(notFound);
app.use(errorHandler);

// ✅ Socket.IO Real-Time Messaging
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("sendMessage", ({ senderId, receiverId, content }) => {
    io.emit("receiveMessage", {
      senderId,
      receiverId,
      content,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${socket.id} (${reason})`);
  });

  socket.on("error", (error) => {
    console.error("🔥 Socket.IO Error:", error);
  });
});

// ✅ Graceful Shutdown Handling (CTRL+C / Process Kill)
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down server...");
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed.");
  server.close(() => {
    console.log("✅ HTTP server closed.");
    process.exit(0);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🔗 Swagger Docs: http://localhost:${PORT}/api-docs`);
});

export { app, server };

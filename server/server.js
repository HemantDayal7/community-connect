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
import socketSetup from "./sockets/chatSocket.js"; // ✅ Import WebSocket handler

dotenv.config(); // ✅ Load Environment Variables

// ✅ Initialize Express & HTTP Server
const app = express();
const server = http.createServer(app);

// ✅ Define allowed CORS origins
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5050",
];

// ✅ Secure CORS for WebSockets & Express
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// ✅ Improved Content Security Policy (CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "http://localhost:5050", "https://cdn.socket.io"],
        connectSrc: ["'self'", "ws://localhost:5050", "http://localhost:5050"],
      },
    },
  })
);

// ✅ Serve Socket.IO Client Locally
app.use("/socket.io", express.static("node_modules/socket.io/client-dist"));

// ✅ Initialize WebSocket Server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// ✅ Connect to MongoDB (only if not running in test mode)
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// ✅ Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(requestLogger);
app.use(favicon(path.join(process.cwd(), "public", "favicon.ico")));

// ✅ JSON Error Handling Middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ JSON Parsing Error:", err.message);
    return res.status(400).json({ success: false, message: "Invalid JSON format" });
  }
  next(err);
});

// ✅ Apply Rate Limiting
app.use("/api", apiLimiter);

// ✅ Setup API Documentation (Swagger)
setupSwagger(app);

// ✅ Import API Routes
import authRoutes from "./routes/v1/authRoutes.js";
import userRoutes from "./routes/v1/userRoutes.js";
import eventRoutes from "./routes/v1/eventRoutes.js";
import helpRequestRoutes from "./routes/v1/helpRequestRoutes.js";
import messagesRoutes from "./routes/v1/messagesRoutes.js";
import resourceRoutes from "./routes/v1/resourceRoutes.js";
import skillSharingRoutes from "./routes/v1/skillSharingRoutes.js";
import userStatusRoutes from "./routes/v1/userStatusRoutes.js";
import healthCheck from "./routes/v1/healthCheck.js";

// ✅ Register API Routes
const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}/helprequests`, helpRequestRoutes);
app.use(`${API_PREFIX}/messages`, messagesRoutes);
app.use(`${API_PREFIX}/resources`, resourceRoutes);
app.use(`${API_PREFIX}/skillsharings`, skillSharingRoutes);
app.use(`${API_PREFIX}/user-status`, userStatusRoutes);
app.use(`${API_PREFIX}/health`, healthCheck);

// ✅ Default API Route
app.get(API_PREFIX, (req, res) => {
  res.status(200).json({ message: "🎉 Welcome to the Community Connect API!" });
});

// ✅ Catch 404 Routes
app.use((req, res, next) => {
  console.warn(`⚠️ 404 - Route Not Found: ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `❌ Not Found - ${req.originalUrl}` });
});

// ✅ Error Handling Middleware
app.use(errorLogger);
app.use(notFound);
app.use(errorHandler);

// ✅ Initialize WebSockets
socketSetup(io);

// ✅ WebSocket Error Handling
io.on("error", (err) => {
  console.error("❌ WebSocket Error:", err.message);
});

// ✅ Graceful Shutdown Handling
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down server...");

  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed.");
  } catch (err) {
    console.error("❌ Error closing MongoDB connection:", err.message);
  }

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
  console.log(`📡 Socket.IO Client: http://localhost:${PORT}/socket.io/socket.io.js`);
});

export { app, server };

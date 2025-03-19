// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io"; // Ensure this is imported only once
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import favicon from "serve-favicon";
import mongoose from "mongoose";
import fs from "fs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

// Load environment variables
dotenv.config();

// Internal Imports
import { envConfig } from "./config/envConfig.js";
import connectDB from "./config/db.js";
import setupSwagger from "./config/swagger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestLogger, errorLogger } from "./middleware/loggingMiddleware.js";
import apiLimiter from "./middleware/rateLimiter.js";
import socketSetup from "./sockets/chatSocket.js"; // Socket.IO handler
import Message from "./models/Message.js";
import Notification from "./models/Notification.js";
import debugRoutes from './routes/debug.js';
import skillRequestRoutes from "./routes/v1/skillRequestRoutes.js";
import skillReviewRoutes from "./routes/v1/skillReviewRoutes.js";

// Helper function: verify JWT token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, envConfig.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.log("Token verification failed:", error.message);
    return null;
  }
};

// Initialize Express & HTTP Server
const app = express();
const server = http.createServer(app);

// Set trust proxy (important for rate limiting and IP tracking)
app.set("trust proxy", 1);

// Define allowed CORS origins
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5050",
  "https://community-connect.vercel.app",
];

// Secure CORS for Express and Socket.IO
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// Enhance Security with Helmet
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

// Serve Socket.IO client from node_modules
app.use("/socket.io", express.static("node_modules/socket.io/client-dist"));

// Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.set("io", io);

// Determine if in development mode
const isDevelopment = process.env.NODE_ENV !== "production";

// Socket authentication middleware
io.use((socket, next) => {
  // Allow development connections with a special query param
  if (process.env.NODE_ENV !== 'production' && socket.handshake.query?.dev === 'true') {
    console.log("🔧 Development connection accepted:", socket.id);
    socket.user = { id: 'dev-user' }; // Set a placeholder user
    return next();
  }
  
  // Check for token in socket.handshake.auth
  const token = socket.handshake.auth?.token;
  
  if (!token) {
    console.log("❌ Socket connection rejected: No token provided");
    return next(new Error("Authentication required"));
  }
  
  try {
    const userData = verifyToken(token);
    if (!userData) {
      console.log("❌ Socket connection rejected: Invalid token");
      return next(new Error("Invalid authentication"));
    }
    
    // Set user data on socket for future reference
    socket.user = userData;
    console.log(`✅ Authenticated socket connection: ${userData.name || userData.id || userData._id}`);
    next();
  } catch (error) {
    console.log("❌ Socket connection rejected:", error.message);
    next(new Error("Authentication failed"));
  }
});

// Connect to MongoDB (skip connection if in test mode)
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(requestLogger);
app.use(favicon(path.join(process.cwd(), "public", "favicon.ico")));
app.use(cookieParser());

// ----- FIXED: Static File Serving for Uploads -----
// Define paths and ensure directory exists (ONCE)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(process.cwd(), "uploads");
console.log("📁 Uploads directory path:", uploadsDir);

try {
  if (!fs.existsSync(uploadsDir)) {
    console.log("📁 Creating uploads directory");
    fs.mkdirSync(uploadsDir, { recursive: true });
  } else {
    const files = fs.readdirSync(uploadsDir);
    console.log(`📁 Found ${files.length} files in uploads directory:`);
    files.forEach(file => console.log(`   - ${file}`));
  }
} catch (err) {
  console.error("❌ Error with uploads directory:", err);
}

// FIXED: Single middleware for serving static files from uploads
app.use("/uploads", (req, res, next) => {
  // Enhanced logging for debugging
  console.log(`📁 Static file requested: ${req.path}`);
  
  try {
    // Check if the file exists before continuing
    const filePath = path.join(process.cwd(), 'uploads', req.path);
    if (fs.existsSync(filePath)) {
      console.log(`✅ File exists: ${filePath}`);
      
      // Set appropriate content type header based on file extension
      if (req.path.match(/\.(jpg|jpeg|JPG|JPEG)$/i)) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (req.path.match(/\.(png|PNG)$/i)) {
        res.setHeader('Content-Type', 'image/png');
      } else if (req.path.match(/\.(gif|GIF)$/i)) {
        res.setHeader('Content-Type', 'image/gif');
      }
      
      // Allow any origin to prevent CORS issues
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Cache control - prevent caching during development
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
    } else {
      console.error(`❌ File not found: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Error checking file: ${err.message}`);
  }
  
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Add static file serving for public directory (for our test HTML file)
app.use(express.static(path.join(process.cwd(), 'public')));

// Add debug routes ONCE
app.use('/debug', debugRoutes);

// Graceful JSON Parsing Error Handling
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ JSON Parsing Error:", err.message);
    return res.status(400).json({ success: false, message: "Invalid JSON format" });
  }
  next(err);
});

// Apply Rate Limiting to sensitive endpoints
app.use("/api/v1/auth", apiLimiter);
app.use("/api/v1/users/password", apiLimiter);

// More permissive limiter for reviews
const reviewsLimiter = rateLimit({
  windowMs: 15 * 60 * 0,
  max: 200,
  message: "Too many review submissions, please try again in 15 minutes.",
  headers: true,
});
app.use("/api/v1/reviews", reviewsLimiter);

// Setup API Documentation (Swagger)
setupSwagger(app);

// Add before your routes registration
app.use((req, res, next) => {
  // Store original res.json method
  const originalJson = res.json;
  
  // Override res.json to log responses
  res.json = function(body) {
    console.log(`Response to ${req.method} ${req.originalUrl}:`, 
      JSON.stringify(body).substring(0, 200) + "...");
    return originalJson.call(this, body);
  };
  
  next();
});

// Import API Routes
import authRoutes from "./routes/v1/authRoutes.js";
import userRoutes from "./routes/v1/userRoutes.js";
import eventRoutes from "./routes/v1/eventRoutes.js";
import helpRequestRoutes from "./routes/v1/helpRequestRoutes.js";
import resourceRoutes from "./routes/v1/resourceRoutes.js";
import skillSharingRoutes from "./routes/v1/skillSharingRoutes.js";
import userStatusRoutes from "./routes/v1/userStatusRoutes.js";
import healthCheck from "./routes/v1/healthCheck.js";
import reviewRoutes from "./routes/v1/reviewRoutes.js";
import notificationRoutes from "./routes/v1/notificationRoutes.js";
import messageRoutes from "./routes/v1/messageRoutes.js";
import dashboardRoutes from "./routes/v1/dashboardRoutes.js";

// Register API Routes with prefix
const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}/helprequests`, helpRequestRoutes);
app.use(`${API_PREFIX}/resources`, resourceRoutes);
app.use(`${API_PREFIX}/skillsharings`, skillSharingRoutes);
app.use(`${API_PREFIX}/user-status`, userStatusRoutes);
app.use(`${API_PREFIX}/health`, healthCheck);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use('/debug', debugRoutes);
app.use("/api/v1/skillrequests", skillRequestRoutes);
app.use("/api/v1/skillreviews", skillReviewRoutes);

// Default API Route
app.get(API_PREFIX, (req, res) => {
  res.status(200).json({ message: "🎉 Welcome to the Community Connect API!" });
});

// Catch-all 404 handler
app.use((req, res, next) => {
  console.warn(`⚠️ 404 - Route Not Found: ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `❌ Not Found - ${req.originalUrl}` });
});

// Error Handling Middleware
app.use(errorLogger);
app.use(notFound);
app.use(errorHandler);

// Initialize WebSocket handlers
socketSetup(io);

// Additional Socket.IO connection handlers
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("authenticate", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} authenticated and joined their room`);
    }
  });

  socket.on("join", ({ userId }) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);
    }
  });

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("leaveRoom", ({ roomId }) => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const message = new Message({
        senderId: data.from || data.senderId,
        recipientId: data.to || data.recipientId,
        content: data.message || data.content,
        resourceId: data.resourceId,
      });
      await message.save();

      const roomId = data.roomId || [data.senderId, data.recipientId].sort().join("-");
      io.to(roomId).emit("message", message);
      io.to(data.to || data.recipientId).emit("receiveMessage", {
        _id: message._id,
        senderId: data.from || data.senderId,
        recipientId: data.to || data.recipientId,
        content: data.message || data.content,
        createdAt: message.createdAt,
        resourceId: data.resourceId,
      });

      const notification = new Notification({
        userId: data.to || data.recipientId,
        message: `New message from ${data.senderName || "someone"}`,
        type: "message",
        isRead: false,
      });
      await notification.save();

      io.to(data.to || data.recipientId).emit("notification", {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Graceful Shutdown Handling
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
    setTimeout(() => {
      console.log("✅ Process terminated.");
      process.exit(0);
    }, 1000);
  });
  setTimeout(() => {
    console.error("⚠️ Server shutdown timed out, forcing exit");
    process.exit(1);
  }, 10000);
});

let isShuttingDown = false;
["SIGINT", "SIGTERM", "SIGUSR2"].forEach((signal) => {
  process.on(signal, async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    if (io) {
      console.log("Closing Socket.IO connections...");
      io.close();
      console.log("✅ Socket.IO server closed");
    }
    try {
      if (mongoose.connection.readyState !== 0) {
        console.log("Closing MongoDB connection...");
        await mongoose.connection.close(false);
        console.log("✅ MongoDB connection closed");
      }
    } catch (err) {
      console.error("❌ Error closing MongoDB connection:", err);
    }
    if (server) {
      server.close(() => {
        console.log("✅ HTTP server closed");
        setTimeout(() => {
          console.log("✅ Process terminated");
          process.exit(0);
        }, 500);
      });
      setTimeout(() => {
        console.warn("⚠️ Forced exit after timeout");
        process.exit(1);
      }, 5000);
    } else {
      process.exit(0);
    }
  });
});

// Handle nodemon restarts
process.once("SIGUSR2", () => {
  console.log("🔄 nodemon restart detected");
  process.kill(process.pid, "SIGUSR2");
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});

// Start the Server
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🔗 Swagger Docs: http://localhost:${PORT}/api-docs`);
  console.log(`📡 Socket.IO Client: http://localhost:${PORT}/socket.io/socket.io.js`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads/[filename]`);
});

// Export for testing if needed
export { app, server, io };

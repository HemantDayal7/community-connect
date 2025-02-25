import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import favicon from "serve-favicon";
import connectDB from "./config/db.js";
import setupSwagger from "./config/swagger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestLogger, errorLogger } from "./middleware/loggingMiddleware.js";

// ✅ Load Environment Variables
dotenv.config();

// ✅ Initialize Express & Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(helmet());
app.use(morgan("dev"));
app.use(requestLogger);

// ✅ Rate Limiting
app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // Limit each IP to 50 requests per minute
    message: "Too many requests, please try again later.",
  })
);

// ✅ Serve Favicon
app.use(favicon(path.join(process.cwd(), "public", "favicon.ico")));

// ✅ Setup Swagger Documentation
setupSwagger(app);

// ✅ Import API Routes
import authRoutes from "./routes/v1/authRoutes.js";
import userRoutes from "./routes/v1/userRoutes.js";
import eventRoutes from "./routes/v1/eventRoutes.js";
import helpRequestRoutes from "./routes/v1/helpRequestRoutes.js";
import messagesRoutes from "./routes/v1/messagesRoutes.js"; 
import resourceRoutes from "./routes/v1/resourceRoutes.js";
import skillSharingRoutes from "./routes/v1/skillSharingRoutes.js";
import healthCheck from "./routes/v1/healthCheck.js";

// ✅ API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/helprequests", helpRequestRoutes);
app.use("/api/v1/messages", messagesRoutes);
app.use("/api/v1/resources", resourceRoutes);
app.use("/api/v1/skillsharings", skillSharingRoutes);
app.use("/api/v1/health", healthCheck);

// ✅ Default API Route
app.get("/api/v1", (req, res) => {
  res.status(200).json({ message: "Welcome to the Community Connect API!" });
});

// ✅ Error Handling Middleware
app.use(errorLogger);
app.use(notFound);
app.use(errorHandler);

// ✅ Socket.IO Real-Time Messaging
io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("sendMessage", ({ senderId, receiverId, content }) => {
        io.emit("receiveMessage", { senderId, receiverId, content, timestamp: new Date() });
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});

// ✅ Start Server
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 API Base URL: http://localhost:${PORT}/api/v1`);
    console.log(`🔗 Swagger Docs: http://localhost:${PORT}/api-docs`);
});
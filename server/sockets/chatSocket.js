import Message from "../models/Message.js";
import UserStatus from "../models/UserStatus.js";

const socketSetup = (io) => {
  // Map to track user socket connections
  const userSocketMap = new Map();

  io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user authentication
    socket.on("authenticate", async (userId) => {
      if (!userId) {
        console.log("User did not provide ID for authentication");
        return;
      }
      
      console.log(`User ${userId} authenticated`);
      userSocketMap.set(userId, socket.id);
      socket.userId = userId;
      
      // Join user's personal room
      socket.join(userId.toString());
      
      // Optionally update user's online status
      try {
        await UserStatus.findOneAndUpdate(
          { userId },
          { isOnline: true, lastSeen: new Date() },
          { upsert: true }
        );
        
        // Emit user status update
        io.emit("userStatus", { userId, isOnline: true });
      } catch (err) {
        console.error(`Error updating online status for ${userId}:`, err);
      }
      
      // Send any pending messages
      try {
        const pendingMessages = await Message.find({
          recipientId: userId,
          read: false
        }).populate("senderId", "name avatar");
        
        if (pendingMessages.length > 0) {
          console.log(`Sending ${pendingMessages.length} pending messages to ${userId}`);
          
          for (const message of pendingMessages) {
            socket.emit("message", message);
          }
        }
      } catch (err) {
        console.error(`Error fetching pending messages for ${userId}:`, err);
      }
    });

    // Handle message sending
    socket.on("sendMessage", async (data) => {
      try {
        const { recipientId, senderId, content, resourceId } = data;
        
        if (!recipientId || !senderId || !content) {
          console.log("Invalid message data:", data);
          return;
        }
        
        console.log(`Message: ${senderId} → ${recipientId}: "${content}"`);
        
        // Create message in database
        const message = new Message({
          senderId,
          recipientId,
          content,
          resourceId,
          read: false
        });
        
        await message.save();
        
        // Get recipient's socket
        const recipientSocketId = userSocketMap.get(recipientId);
        
        if (recipientSocketId) {
          // Recipient is online, deliver message
          io.to(recipientId.toString()).emit("message", message);
        } else {
          console.log(`User ${recipientId} is offline, message saved to DB`);
        }
      } catch (err) {
        console.error("Error handling sendMessage event:", err);
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      try {
        console.log(`User disconnected: ${socket.id}`);
        
        if (socket.userId) {
          // Remove from user socket map
          userSocketMap.delete(socket.userId);
          
          // Update online status
          await UserStatus.findOneAndUpdate(
            { userId: socket.userId },
            { isOnline: false, lastSeen: new Date() }
          );
          
          // Emit user status update
          io.emit("userStatus", { userId: socket.userId, isOnline: false });
        }
      } catch (err) {
        console.error("Error handling disconnect:", err);
      }
    });
  });
};

export default socketSetup;
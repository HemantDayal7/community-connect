import Message from "../models/Message.js";
import UserStatus from "../models/UserStatus.js";

const socketSetup = (io) => {
    // ✅ Maintain a Map of Users and Their Socket IDs
    const userSocketMap = new Map();

    io.on("connection", async (socket) => {
        console.log(`🔵 User connected: ${socket.id}`);

        // ✅ Handle user coming online
        socket.on("userOnline", async (userId) => {
            try {
                console.log(`✅ User ${userId} is online`);

                // Store user's socket ID
                userSocketMap.set(userId, socket.id);
                socket.userId = userId; // Attach userId to socket for tracking

                // Mark user as online in DB
                await UserStatus.findOneAndUpdate(
                    { userId },
                    { isOnline: true, lastSeen: new Date() },
                    { upsert: true, new: true }
                );

                io.emit("updateUserStatus", { userId, isOnline: true });

                // ✅ Fetch undelivered messages and send them
                const pendingMessages = await Message.find({
                    receiverId: userId,
                    isRead: false,
                }).sort({ createdAt: 1 }); // Send messages in the correct order                

                if (pendingMessages.length > 0) {
                    pendingMessages.forEach((message) => {
                        socket.emit("receiveMessage", message);
                    });

                    // Mark pending messages as read
                    await Message.updateMany(
                        { receiverId: userId, isRead: false },
                        { isRead: true }
                    );

                    console.log(`📩 Sent ${pendingMessages.length} pending messages to ${userId}`);
                }
            } catch (error) {
                console.error("❌ Error updating online status:", error.message);
            }
        });

        // ✅ Handle sending messages
        socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
            try {
                const newMessage = new Message({
                    senderId,
                    receiverId,
                    content,
                    isRead: false, // Mark as unread initially
                });

                await newMessage.save();
                console.log(`📩 Message from ${senderId} to ${receiverId}: "${content}"`);

                // 🔹 Check if the receiver is online
                const receiverSocketId = userSocketMap.get(receiverId);

                if (receiverSocketId) {
                    // 🛑 Emit message in real-time to the intended receiver
                    io.to(receiverSocketId).emit("receiveMessage", newMessage);

                    // Mark message as read
                    await Message.findByIdAndUpdate(newMessage._id, { isRead: true });

                    console.log(`📩 Delivered message to online user ${receiverId}`);
                } else {
                    console.log(`⚠️ User ${receiverId} is offline, message saved in DB.`);
                }
            } catch (error) {
                console.error("❌ Error sending message:", error.message);
            }
        });

        // ✅ Handle user disconnect
        socket.on("disconnect", async () => {
            try {
                console.log(`🔴 User disconnected: ${socket.id}`);

                // Find userId from userSocketMap
                const userId = [...userSocketMap.entries()].find(([_, id]) => id === socket.id)?.[0];

                if (userId) {
                    userSocketMap.delete(userId);

                    await UserStatus.findOneAndUpdate(
                        { userId },
                        { isOnline: false, lastSeen: new Date() },
                        { new: true }
                    );

                    console.log(`✅ User ${userId} is offline`);
                    io.emit("updateUserStatus", { userId, isOnline: false });
                }
            } catch (error) {
                console.error("❌ Error updating offline status:", error.message);
            }
        });
    });
};

export default socketSetup;

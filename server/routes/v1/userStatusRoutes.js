import express from "express";
import UserStatus from "../../models/UserStatus.js";

const router = express.Router();

// Get user online status
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const status = await UserStatus.findOne({ userId });

        if (!status) {
            return res.status(404).json({ message: "User status not found" });
        }

        res.json({ isOnline: status.isOnline, lastSeen: status.lastSeen });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user status", error });
    }
});

export default router;

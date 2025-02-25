import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

export const protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization;

        if (!token || !token.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided, authorization denied" });
        }

        token = token.split(" ")[1];

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    return res.status(401).json({ message: "Token expired, please refresh" });
                }
                return res.status(401).json({ message: "Invalid token" });
            }

            req.user = await User.findById(decoded.id).select("-password");
            next();
        });
    } catch (error) {
        console.error("Authentication error:", error.message);
        return res.status(401).json({ message: "Token verification failed", error: error.message });
    }
};

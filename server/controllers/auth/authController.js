import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Function to generate Access Token (Expires in 1 hour)
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Function to generate Refresh Token (Expires in 7 days)
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// @desc Register a new user
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        if (user) {
            // Generate Tokens
            const accessToken = generateAccessToken(user.id);
            const refreshToken = generateRefreshToken(user.id);

            // Send Refresh Token as HttpOnly Cookie
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
            });

            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                accessToken,
            });
        } else {
            res.status(400).json({ msg: "Invalid user data" });
        }
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

// @desc Authenticate user & get token
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Generate Tokens
            const accessToken = generateAccessToken(user.id);
            const refreshToken = generateRefreshToken(user.id);

            // Send Refresh Token as HttpOnly Cookie
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
            });

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                accessToken,
            });
        } else {
            res.status(401).json({ msg: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

// @desc Refresh Access Token
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(403).json({ message: "Refresh Token Required" });
        }

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Invalid Refresh Token" });
            }

            const newAccessToken = generateAccessToken(decoded.id);
            res.json({ accessToken: newAccessToken });
        });
    } catch (error) {
        console.error("Error refreshing token:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

// @desc Get user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ msg: "User not found" });
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

// @desc Update user profile
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;

            if (req.body.password) {
                user.password = await bcrypt.hash(req.body.password, 10);
            }

            await user.save();

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateAccessToken(user.id),
            });
        } else {
            res.status(404).json({ msg: "User not found" });
        }
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

// ✅ Ensure all functions are properly exported
export default {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    refreshToken
};

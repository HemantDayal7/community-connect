import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { validationResult } from "express-validator";

dotenv.config();

// ✅ Helper Function: Generate Access Token (Valid for 1 Hour)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// ✅ Helper Function: Generate Refresh Token (Valid for 7 Days)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// ✅ Register User
export const registerUser = async (req, res, next) => {
  try {
    // ✅ Validate input using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // ✅ Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      const error = new Error("User already exists");
      error.statusCode = 400;
      return next(error);
    }

    // ✅ Hash Password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (!user) {
      throw new Error("User registration failed");
    }

    // ✅ Generate Access & Refresh Tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // ✅ Set Refresh Token as HttpOnly Cookie (Security best practice)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure only in production
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
    });

    // ✅ Return Success Response
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      accessToken,
    });
  } catch (error) {
    next(error); // ✅ Send error to centralized errorHandler middleware
  }
};

// ✅ Login User
export const loginUser = async (req, res, next) => {
  try {
    // ✅ Validate input using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // ✅ Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      return next(error);
    }

    // ✅ Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      return next(error);
    }

    // ✅ Generate Tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // ✅ Set Refresh Token as HttpOnly Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
    });

    // ✅ Return Success Response
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Refresh Access Token
export const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(403).json({ message: "Refresh Token Required" });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        const error = new Error("Invalid Refresh Token");
        error.statusCode = 403;
        return next(error);
      }

      res.json({ accessToken: generateAccessToken(decoded.id) });
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get User Profile (Authenticated Users Only)
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// ✅ Update User Profile
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    // ✅ If password is provided, hash it before saving
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      accessToken: generateAccessToken(user.id), // ✅ Return new token
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Logout User
export const logoutUser = async (req, res, next) => {
  try {
    res.cookie("refreshToken", "", { expires: new Date(0) }); // ✅ Clear cookie
    res.json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

// ✅ Export All Auth Controller Functions
export default {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  refreshToken,
  logoutUser, // ✅ Logout function added
};

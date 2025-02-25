import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  deleteUser,
} from "../../controllers/user/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

router.get("/", protect, getAllUsers);
router.get("/:id", protect, getUserById);
router.delete("/:id", protect, deleteUser);

export default router;

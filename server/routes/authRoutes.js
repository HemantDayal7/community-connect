const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware"); // ✅ Correct Import

// @route    POST /auth/register
// @desc     Register new user
// @access   Public
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
  ],
  authController.register
);

// @route    POST /auth/login
// @desc     Authenticate user & get token
// @access   Public
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  authController.login
);

// @route    GET /auth/me
// @desc     Get logged-in user details
// @access   Private (Requires JWT Token)
router.get("/me", protect, authController.getLoggedInUser); // ✅ Correct Usage of protect

module.exports = router;

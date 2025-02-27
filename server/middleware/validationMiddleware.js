import { validationResult, body, param } from "express-validator";

// ✅ Middleware to handle validation errors
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
      })),
    });
  }
  next();
};

// ✅ User Validation
export const validateRegister = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  validateRequest,
];

export const validateLogin = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

export const validateUpdateProfile = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  validateRequest,
];

export const validateUserId = [
  param("id").isMongoId().withMessage("Invalid User ID format"),
  validateRequest,
];

// ✅ Help Request Validation
export const validateHelpRequest = [
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("location").notEmpty().withMessage("Location is required"),
  validateRequest,
];

export const validateHelpRequestId = [
  param("id").isMongoId().withMessage("Invalid Help Request ID format"),
  validateRequest,
];

// ✅ Event Validation
export const validateEvent = [
  body("title").notEmpty().withMessage("Title is required"),
  body("date").isISO8601().withMessage("Invalid date format"),
  body("location").notEmpty().withMessage("Location is required"),
  body("hostId").isMongoId().withMessage("Invalid host ID"),
  validateRequest,
];

export const validateEventId = [
  param("id").isMongoId().withMessage("Invalid Event ID format"),
  validateRequest,
];

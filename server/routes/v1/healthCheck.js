import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Community Connect API is running smoothly 🚀",
    timestamp: new Date(),
  });
});

export default router;

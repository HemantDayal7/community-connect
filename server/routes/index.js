const express = require("express");
const router = express.Router();

router.use("/auth", require("./authRoutes"));
router.use("/events", require("./eventRoutes"));
router.use("/helprequests", require("./helpRequestRoutes"));
router.use("/resources", require("./resourceRoutes"));
router.use("/skillsharings", require("./skillSharingRoutes"));
router.use("/users", require("./userRoutes"));
router.use("/messages", require("./messagesRoutes")); // Add Messages API

module.exports = router;

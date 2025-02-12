const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  console.log("Headers:", req.headers); // Debugging log

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded Token:", decoded); // Debugging log

      // Ensure decoded userId exists
      if (!decoded.userId) {
        return res.status(401).json({ msg: "Invalid token structure, unauthorized" });
      }

      // Attach user to request object
      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return res.status(401).json({ msg: "User not found, unauthorized" });
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      res.status(401).json({ msg: "Token verification failed, unauthorized" });
    }
  } else {
    return res.status(401).json({ msg: "No token provided, unauthorized" });
  }
};

module.exports = { protect };

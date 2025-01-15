// Backend/middleware/secureRoute.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const secureRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please provide a Bearer token",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_TOKEN) {
      console.error("JWT_TOKEN not found in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_TOKEN);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      req.user = user;
      next();
    } catch (verifyError) {
      console.error("Token verification error:", verifyError);
      return res.status(401).json({
        error: "Invalid token",
        details: "Token signature verification failed",
      });
    }
  } catch (error) {
    console.error("SecureRoute error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};

export default secureRoute;

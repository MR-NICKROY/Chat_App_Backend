import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const secureRoute = async (req, res, next) => {
  try {
    // Check both Authorization header and cookie
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies.jwt;
    console.log(cookieToken);
    let token;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (cookieToken) {
      token = cookieToken;
    } else {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please provide a valid token",
      });
    }

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

      // Generate new token if current one is close to expiring
      const tokenExp = decoded.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = tokenExp - currentTime;

      if (timeUntilExpiry < 24 * 60 * 60 * 1000) {
        // Less than 1 day remaining
        const newToken = createTokenAndSaveCookie(user._id, res);
        res.set("Authorization", `Bearer ${newToken}`);
      }

      req.user = user;
      next();
    } catch (verifyError) {
      if (verifyError.name === "TokenExpiredError") {
        // Clear expired token
        res.clearCookie("jwt");
        return res.status(401).json({
          error: "Token expired",
          message: "Please login again to obtain a new token",
        });
      }

      console.error("Token verification error:", verifyError);
      return res.status(401).json({
        error: "Invalid token",
        details: verifyError.message,
      });
    }
  } catch (error) {
    console.error("SecureRoute error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};

export default secureRoute;

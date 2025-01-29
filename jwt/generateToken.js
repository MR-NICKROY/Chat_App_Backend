// Backend/jwt/generateToken.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const createTokenAndSaveCookie = (userId, res) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_TOKEN,
    { expiresIn: "30d" } // Increased token expiration time
  );

  // Set token in cookie with matching expiration
  if (res) {
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    });
  }

  return token;
};

export default createTokenAndSaveCookie;

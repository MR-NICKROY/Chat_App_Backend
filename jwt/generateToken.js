// Backend/jwt/generateToken.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const createTokenAndSaveCookie = (userId) => {
  try {
    if (!process.env.JWT_TOKEN) {
      throw new Error("JWT_TOKEN is not defined");
    }

    const token = jwt.sign(
      { userId: userId.toString() },
      process.env.JWT_TOKEN,
      {
        expiresIn: "10d",
        algorithm: "HS256",
      }
    );

    return token;
  } catch (error) {
    console.error("Token generation error:", error);
    throw error;
  }
};

export default createTokenAndSaveCookie;

// Backend/routes/user.route.js
import express from "express";
// Add to user.route.js
import jwt from "jsonwebtoken";
import {
  allUsers,
  login,
  logout,
  signup,
  setting,
} from "../controller/user.controller.js";
import secureRoute from "../middleware/secureRoute.js";
import upload from "../multerConfig.js";

const router = express.Router();

router.post("/signup", upload.single("profileImage"), signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/allusers", secureRoute, allUsers);

// Backend/routes/user.route.js
router.patch("/setting", secureRoute, upload.single("profileImage"), setting);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File size is too large. Max limit is 5MB",
      });
    }
    return res.status(400).json({
      error: error.message,
    });
  }
});

export default router;

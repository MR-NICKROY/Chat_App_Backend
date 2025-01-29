import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import createTokenAndSaveCookie from "../jwt/generateToken.js";
// Backend/controller/user.controller.js - signup function
export const signup = async (req, res) => {
  try {
    const { fullname, email, password, gender } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    if (!fullname || !email || !password || !gender) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullname,
      email,
      password: hashPassword,
      gender,
      profileImage,
    });

    await newUser.save();

    try {
      const token = createTokenAndSaveCookie(newUser._id, res);

      res.status(201).json({
        message: "User created successfully",
        user: {
          _id: newUser._id,
          fullname: newUser.fullname,
          email: newUser.email,
          gender: newUser.gender,
          profileImage: newUser.profileImage,
        },
        token,
      });
    } catch (tokenError) {
      console.error("Token generation error:", tokenError);
      return res
        .status(500)
        .json({ error: "Error generating authentication token" });
    }
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Backend/controller/user.controller.js - login function
// In user.controller.js - login function
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate token and set cookie
    const token = createTokenAndSaveCookie(user._id, res);

    // Set Authorization header
    res.set("Authorization", `Bearer ${token}`);

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        gender: user.gender,
        profileImage: user.profileImage,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(201).json({ message: "User logged out successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Backend/controller/user.controller.js
// Backend/controller/user.controller.js
export const allUsers = async (req, res) => {
  try {
    const loggedInUser = req.user._id;

    // Add logging to debug
    console.log("Logged in user ID:", loggedInUser);

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUser },
    }).select("-password");

    // Add logging to debug
    console.log("Found users:", filteredUsers.length);

    // Transform the users to include full profile image URLs
    const usersWithFullImagePaths = filteredUsers.map((user) => {
      const userObj = user.toObject();
      if (userObj.profileImage) {
        userObj.profileImage = userObj.profileImage.startsWith("/")
          ? userObj.profileImage
          : `/${userObj.profileImage}`;
      }
      return userObj;
    });

    res.status(200).json(usersWithFullImagePaths);
  } catch (error) {
    console.log("Error in getAllUsers: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Backend/controller/user.controller.js

export const setting = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullname, email } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email already exists (excluding current user)
    if (email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: userId },
      });
      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Build update object
    const updateFields = {};
    if (fullname) updateFields.fullname = fullname;
    if (email) updateFields.email = email;
    if (profileImage) updateFields.profileImage = profileImage;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("Error in settings update: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

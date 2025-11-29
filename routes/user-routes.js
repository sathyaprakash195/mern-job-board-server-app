const express = require("express");
const router = express.Router();
const UserModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth-middleware");

router.post("/register", async (req, res) => {
  try {
    const reqBody = req.body;
    const userExists = await UserModel.findOne({ email: reqBody.email });
    if (userExists) {
      return res.status(400).send("User already exists");
    }

    // hash password before saving (omitted for brevity)
    const hashedPassword = bcrypt.hashSync(reqBody.password, 10);
    reqBody.password = hashedPassword;

    await UserModel.create(reqBody);
    res.send("User registered successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user exists with email
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found with this email" });
    }

    // Check if role matches
    if (user.role !== role) {
      return res
        .status(401)
        .json({ message: "Role does not match the registered account" });
    }

    // Compare passwords
    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "User logged in successfully",
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

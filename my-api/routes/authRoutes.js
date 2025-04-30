// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Route untuk login
router.post("/login", authController.login);

// Route untuk register
router.post("/register", authController.register);

module.exports = router; // Mengekspor router untuk digunakan di file lain

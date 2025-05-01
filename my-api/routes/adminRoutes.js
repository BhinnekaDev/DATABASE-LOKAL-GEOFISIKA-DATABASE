// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("@controllers/adminController");

// Rute untuk edit data admin berdasarkan user_id
router.put("/edit/:user_id", adminController.editAdmin);

module.exports = router;

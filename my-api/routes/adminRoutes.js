// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("@controllers/adminController");
const handleValidasi = require("@middlewares/handleValidasi");
const { validasiAdmin } = require("@middlewares/validasiAdmin");

// Rute untuk edit data admin berdasarkan user_id
router.put(
    "/edit/:user_id",
    validasiAdmin,
    handleValidasi,
    adminController.editAdmin
);

module.exports = router;

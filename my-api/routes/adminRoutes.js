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

// Rute untuk delete data admin berdasarkan user_id
router.delete("/delete/:user_id", adminController.deleteAdmin);

// Rute untuk get data admin
router.get("/fetch", adminController.fetchAdmin);

// Rute untuk get data admin berdasarkan user_id
router.get("/fetch/:user_id", adminController.fetchAdminById);

module.exports = router;

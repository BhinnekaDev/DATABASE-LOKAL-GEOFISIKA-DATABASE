const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
    validasiRegister,
    validasiLogin,
} = require("../middlewares/validasiAuth");
const handleValidasi = require("../middlewares/handleValidasi");

// Route register dengan validasi
router.post(
    "/register",
    validasiRegister,
    handleValidasi,
    authController.register
);

// Route login dengan validasi
router.post("/login", validasiLogin, handleValidasi, authController.login);

module.exports = router;

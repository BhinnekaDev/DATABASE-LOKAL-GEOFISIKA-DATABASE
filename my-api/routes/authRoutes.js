const express = require("express");
const router = express.Router();
const authController = require("@controllers/authController");
const {
    validasiRegister,
    validasiLogin,
} = require("@middlewares/validasiAuth");
const handleValidasi = require("@middlewares/handleValidasi");
const authenticate = require("@middlewares/authenticate");
const rateLimit = require("express-rate-limit");

// NANTI BUKA KALAU DAH PUBLIC
// Batasi maksimal 5 request login dalam 15 menit
// const loginLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 5,
//     message: "Terlalu banyak percobaan login. Coba lagi nanti.",
// });

// Route registrasi dengan validasi input
router.post(
    "/register",
    validasiRegister,
    handleValidasi,
    authController.register,
    authenticate // (opsional) jika ingin langsung login setelah register
);

// Route login dengan rate limiting dan validasi input
router.post(
    "/login",
    // loginLimiter,
    validasiLogin,
    handleValidasi,
    authController.login
);

module.exports = router;

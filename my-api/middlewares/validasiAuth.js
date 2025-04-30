const { body } = require("express-validator");

// Validasi untuk proses registrasi pengguna baru
const validasiRegister = [
    // Validasi email: tidak boleh kosong dan harus dalam format email
    body("email")
        .notEmpty()
        .withMessage("Email wajib diisi")
        .isEmail()
        .withMessage("Format email tidak valid"),

    // Validasi password: tidak boleh kosong dan minimal 6 karakter
    body("password")
        .notEmpty()
        .withMessage("Password wajib diisi")
        .isLength({ min: 6 })
        .withMessage("Password minimal 6 karakter"),

    // Validasi nama depan: wajib diisi
    body("first_name").notEmpty().withMessage("Nama depan wajib diisi"),

    // Validasi nama belakang: wajib diisi
    body("last_name").notEmpty().withMessage("Nama belakang wajib diisi"),

    // Validasi URL foto: opsional, tapi jika ada harus berupa URL yang valid
    body("photo").optional().isURL().withMessage("URL foto tidak valid"),

    // Validasi role: wajib diisi dan hanya boleh salah satu dari 'admin' atau 'superadmin'
    body("role")
        .notEmpty()
        .withMessage("Role wajib diisi")
        .isIn(["admin", "superadmin"])
        .withMessage("Role harus berupa 'admin' atau 'superadmin'"),
];

// Validasi untuk proses login pengguna
const validasiLogin = [
    // Validasi email: wajib diisi dan harus valid
    body("email")
        .notEmpty()
        .withMessage("Email wajib diisi")
        .isEmail()
        .withMessage("Format email tidak valid"),

    // Validasi password: wajib diisi
    body("password").notEmpty().withMessage("Password wajib diisi"),
];

// Mengekspor kedua validasi agar bisa digunakan di route/controller
module.exports = { validasiRegister, validasiLogin };

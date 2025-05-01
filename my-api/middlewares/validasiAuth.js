const { body } = require("express-validator");

// Validasi input registrasi
const validasiRegister = [
    body("email")
        .notEmpty()
        .withMessage("Email wajib diisi")
        .isEmail()
        .withMessage("Format email tidak valid"),

    body("password")
        .notEmpty()
        .withMessage("Password wajib diisi")
        .isLength({ min: 6 })
        .withMessage("Password minimal 6 karakter")
        .matches(/[a-z]/)
        .withMessage("Password harus mengandung huruf kecil")
        .matches(/[A-Z]/)
        .withMessage("Password harus mengandung huruf besar")
        .matches(/[0-9]/)
        .withMessage("Password harus mengandung angka")
        .matches(/[\W_]/)
        .withMessage(
            "Password harus mengandung simbol (misal: !, @, #, $, %, ^, &, *)"
        )
        .not()
        .matches(/\s/)
        .withMessage("Password tidak boleh mengandung spasi")
        .not()
        .matches(/(\w)\1\1\1/)
        .withMessage("Password tidak boleh mengandung 4 karakter berurutan"),

    body("first_name").notEmpty().withMessage("Nama depan wajib diisi"),
    body("last_name").notEmpty().withMessage("Nama belakang wajib diisi"),

    body("photo").optional().isURL().withMessage("URL foto tidak valid"),

    body("role")
        .notEmpty()
        .withMessage("Role wajib diisi")
        .isIn(["admin", "superadmin"])
        .withMessage("Role harus admin atau superadmin"),
];

// Validasi input login
const validasiLogin = [
    body("email")
        .notEmpty()
        .withMessage("Email wajib diisi")
        .isEmail()
        .withMessage("Format email tidak valid"),

    body("password").notEmpty().withMessage("Password wajib diisi"),
];

module.exports = { validasiRegister, validasiLogin };

const { validationResult } = require("express-validator");

// Middleware untuk menangani hasil validasi dari express-validator
const handleValidasi = (req, res, next) => {
    // Mengambil semua error hasil validasi dari request
    const errors = validationResult(req);

    // Jika ada error (validasi gagal)
    if (!errors.isEmpty()) {
        // Kirim response 422 (Unprocessable Entity) beserta detail error
        return res.status(422).json({
            message: "Validasi gagal",
            errors: errors.array().map((err) => ({
                field: err.param, // Nama field yang error
                message: err.msg, // Pesan error yang sesuai
            })),
        });
    }

    // Jika tidak ada error, lanjut ke middleware/controller berikutnya
    next();
};

// Mengekspor middleware handleValidasi agar bisa digunakan di routes/controller
module.exports = handleValidasi;

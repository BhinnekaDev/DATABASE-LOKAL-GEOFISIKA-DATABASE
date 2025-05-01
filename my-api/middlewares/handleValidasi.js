const { validationResult } = require("express-validator");

// Middleware untuk menangani hasil validasi
const handleValidasi = (req, res, next) => {
    const errors = validationResult(req);

    // Jika ada error, kirim respons 422 dengan detail kesalahan
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: "Validasi gagal",
            errors: errors.array().map((err) => ({
                field: err.param,
                message: err.msg,
            })),
        });
    }

    // Jika validasi lolos, lanjut ke proses berikutnya
    next();
};

module.exports = handleValidasi;

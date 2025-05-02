// middlewares/validasiEvaporation.js
const { body } = require("express-validator");

const validasiEvaporation = [
    body("date")
        .notEmpty()
        .withMessage("Tanggal tidak boleh kosong")
        .isISO8601()
        .withMessage("Format tanggal tidak valid. Gunakan format YYYY-MM-DD"),

    body("evaporation")
        .notEmpty()
        .withMessage("Data evaporation tidak boleh kosong")
        .isFloat({ gt: 0 })
        .withMessage("Evaporation harus berupa angka dan lebih besar dari 0"),
];

module.exports = validasiEvaporation;

// routes/evaporationRoutes.js
const express = require("express");
const router = express.Router();
const evaporationController = require("@controllers/evaporationController");
const handleValidasi = require("@middlewares/handleValidasi");
const validasiEvaporation = require("@middlewares/validasiEvaporation");

router.post(
    "/insert/:user_id",
    validasiEvaporation,
    handleValidasi,
    evaporationController.insertEvaporation
);

router.put(
    "/edit/:user_id/:id_date",
    validasiEvaporation,
    handleValidasi,
    evaporationController.editEvaporation
);

module.exports = router;

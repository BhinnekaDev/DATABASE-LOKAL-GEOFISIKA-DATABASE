// controllers/adminController.js
const adminService = require("@services/adminService");
const { validate } = require("uuid");

// Controller untuk edit admin
const editAdmin = async (req, res) => {
    const { user_id } = req.params;

    // Cek apakah user_id valid UUID
    if (!validate(user_id)) {
        return res
            .status(400)
            .json({ message: "user_id harus berupa UUID yang valid" });
    }

    try {
        // Panggil service editAdmin
        const hasil = await adminService.editAdmin(user_id, req.body);
        res.status(200).json(hasil);
    } catch (error) {
        // Kalau gagal, kirim pesan error
        res.status(400).json({ message: error.message });
    }
};

module.exports = { editAdmin };

// controllers/adminController.js
const adminService = require("@services/adminService");
const { validate } = require("uuid");

const editAdmin = async (req, res) => {
    const { user_id } = req.params;

    // Validasi user_id sebagai UUID
    if (!validate(user_id)) {
        return res
            .status(400)
            .json({ message: "user_id harus berupa UUID yang valid" });
    }

    try {
        const hasil = await adminService.editAdmin(user_id, req.body);
        res.status(200).json(hasil);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { editAdmin };

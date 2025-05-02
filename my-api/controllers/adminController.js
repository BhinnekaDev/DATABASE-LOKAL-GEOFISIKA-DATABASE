// controllers/adminController.js
const adminService = require("@services/adminService");
const { validate } = require("uuid");
const activityLogService = require("@services/activityLogService");

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
        // Mendapatkan informasi IP address dan user agent untuk log
        const ipAddress =
            req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"];

        // Menambahkan log aktivitas ke dalam database
        await activityLogService.addActivityLog(
            user_id, // ID admin yang baru dibuat
            "MENGUBAH", // Jenis aktivitas
            `Admin dengan ID ${user_id} berhasil diubah`, // Deskripsi aktivitas
            ipAddress, // Alamat IP admin
            userAgent // User agent browser atau client
        );
        // Panggil service editAdmin
        const hasil = await adminService.editAdmin(user_id, req.body);
        res.status(200).json(hasil);
    } catch (error) {
        // Kalau gagal, kirim pesan error
        res.status(400).json({ message: error.message });
    }
};

// Controller untuk delete admin
const deleteAdmin = async (req, res) => {
    const { user_id } = req.params;

    // Cek apakah user_id valid UUID
    if (!validate(user_id)) {
        return res
            .status(400)
            .json({ message: "user_id harus berupa UUID yang valid" });
    }

    try {
        // Mendapatkan informasi IP address dan user agent untuk log
        // const ipAddress =
        //     req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        // const userAgent = req.headers["user-agent"];

        // // Menambahkan log aktivitas ke dalam database
        // await activityLogService.addActivityLog(
        //     user_id, // ID admin yang dihapus
        //     "MENGHAPUS", // Jenis aktivitas
        //     `Admin dengan ID ${user_id} berhasil dihapus`, // Deskripsi aktivitas
        //     ipAddress, // Alamat IP admin
        //     userAgent // User agent browser atau client
        // );

        // Panggil service deleteAdmin untuk menghapus admin
        const hasil = await adminService.deleteAdmin(user_id);

        if (hasil) {
            res.status(200).json({
                message: `Admin dengan ID ${user_id} berhasil dihapus`,
            });
        } else {
            res.status(404).json({
                message: `Admin dengan ID ${user_id} tidak ditemukan`,
            });
        }
    } catch (error) {
        // Kalau gagal, kirim pesan error
        res.status(400).json({ message: error.message });
    }
};

module.exports = { editAdmin, deleteAdmin };

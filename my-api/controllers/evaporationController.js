// controllers/evaporationController.js

// Import service yang dibutuhkan
const evaporationService = require("@services/evaporationService");
const activityLogService = require("@services/activityLogService");
const { createClient } = require("@supabase/supabase-js");

// Inisialisasi Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY_SERVICE
);

// Fungsi untuk mendapatkan data admin
const getAdminData = async (user_id) => {
    const { data, error } = await supabase
        .from("admin")
        .select("first_name, last_name, role")
        .eq("user_id", user_id)
        .single();

    if (error) throw new Error(`Error fetching admin data: ${error.message}`);
    return data;
};

// Fungsi untuk menyimpan log aktivitas
const logActivity = async (user_id, action, message, req) => {
    const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    await activityLogService.addActivityLog(
        user_id,
        action,
        message,
        ipAddress,
        userAgent
    );
};

// Fungsi untuk menyimpan data evaporation
const insertEvaporation = async (req, res) => {
    const { user_id } = req.params;
    const { date, evaporation } = req.body;

    try {
        // Simpan data evaporation
        const insertedData = await evaporationService.insertEvaporationData({
            date,
            evaporation,
        });

        // Ambil data admin
        const adminData = await getAdminData(user_id);

        // Gabungkan nama depan dan belakang admin
        const adminName = `${adminData.first_name} ${adminData.last_name}`;
        const role = adminData.role;

        // Simpan log aktivitas
        await logActivity(
            user_id,
            "MENAMBAH DATA EVAPORATION",
            `Data evaporation berhasil ditambahkan oleh ${role} ${adminName} pada tanggal ${date}.`,
            req
        );

        // Kirim respon berhasil
        res.status(201).json({
            message: "Data evaporation berhasil ditambahkan",
            data: insertedData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Terjadi kesalahan saat menambahkan data evaporation",
            error: error.message,
        });
    }
};

// Fungsi untuk mengedit data evaporation
const editEvaporation = async (req, res) => {
    const { user_id, id_date } = req.params;
    const { date, evaporation } = req.body;

    try {
        // Update data evaporation
        const { updatedDateData, updatedEvaporation } =
            await evaporationService.editEvaporationData({
                id_date,
                date,
                evaporation,
            });

        // Ambil data admin untuk log aktivitas
        const adminData = await getAdminData(user_id);

        const adminName = `${adminData.first_name} ${adminData.last_name}`;
        const role = adminData.role;

        // Simpan log aktivitas
        await logActivity(
            user_id,
            "MENGUBAH DATA EVAPORATION",
            `Data evaporation berhasil diperbarui oleh ${role} ${adminName} pada tanggal ${date}.`,
            req
        );

        // Kirim respon berhasil
        res.status(200).json({
            message: "Data evaporation berhasil diperbarui",
            data: { updatedDateData, updatedEvaporation },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Terjadi kesalahan saat memperbarui data evaporation",
            error: error.message,
        });
    }
};

// Ekspor fungsi controller
module.exports = { insertEvaporation, editEvaporation };

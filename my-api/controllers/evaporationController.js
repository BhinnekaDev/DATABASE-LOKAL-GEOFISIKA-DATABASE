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

// Fungsi untuk menyimpan data evaporation
const insertEvaporation = async (req, res) => {
    const { user_id } = req.params;
    const { date, evaporation } = req.body;

    try {
        // Simpan data evaporation ke database
        const insertedData = await evaporationService.insertEvaporationData({
            date,
            evaporation,
        });

        // Ambil data admin berdasarkan user_id
        const { data: adminData, error: adminError } = await supabase
            .from("admin")
            .select("first_name, last_name, role")
            .eq("user_id", user_id)
            .single();

        // Tangani jika terjadi error saat ambil data admin
        if (adminError) {
            throw new Error(`Error fetching admin data: ${adminError.message}`);
        }

        // Gabungkan nama depan dan belakang admin
        const adminName = `${adminData.first_name} ${adminData.last_name}`;
        const role = adminData.role;

        // Ambil IP address dan user-agent dari request
        const ipAddress =
            req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"];

        // Simpan log aktivitas ke sistem
        await activityLogService.addActivityLog(
            user_id,
            "MENAMBAH DATA EVAPORATION",
            `Data evaporation berhasil ditambahkan oleh ${role} ${adminName} pada tanggal ${date}.`,
            ipAddress,
            userAgent
        );

        // Kirim respon berhasil ke client
        res.status(201).json({
            message: "Data evaporation berhasil ditambahkan",
            data: insertedData,
        });
    } catch (error) {
        // Tangani jika terjadi error saat proses
        console.error(error);
        res.status(500).json({
            message: "Terjadi kesalahan saat menambahkan data evaporation",
            error: error.message,
        });
    }
};

// Ekspor fungsi controller
module.exports = { insertEvaporation };

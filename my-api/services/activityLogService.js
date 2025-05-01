// Inisialisasi Supabase client
const { createClient } = require("@supabase/supabase-js");
const { DateTime } = require("luxon");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Fungsi untuk menambahkan log aktivitas ke tabel activity_log
const addActivityLog = async (
    adminId,
    action,
    description,
    ipAddress,
    userAgent
) => {
    const localTime = DateTime.now()
        .setZone("Asia/Jakarta")
        .toLocaleString(DateTime.DATETIME_FULL);
    try {
        const { error } = await supabase.from("activity_log").insert([
            {
                admin_id: adminId,
                action,
                description,
                ip_address: ipAddress,
                user_agent: userAgent,
                created_at: localTime,
            },
        ]);
        if (error)
            throw new Error("Gagal menambahkan activity log: " + error.message);
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = { addActivityLog };

// services/adminService.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY_SERVICE
);

// Fungsi untuk edit data admin (Auth dan tabel admin)
const editAdmin = async (user_id, data) => {
    const { first_name, last_name, email, photo, role, password } = data;

    const display_name = `${first_name} ${last_name}`;

    // Siapkan data buat update di Auth
    const authUpdateData = {
        email,
        user_metadata: { display_name },
    };

    // Kalau ada password baru, sekalian update juga
    if (password) {
        authUpdateData.password = password;
    }

    // Update user di bagian Auth Supabase
    const { error: authError } = await supabase.auth.admin.updateUserById(
        user_id,
        authUpdateData
    );
    if (authError) {
        console.error("Gagal update Auth:", authError.message);
        throw new Error("Gagal update metadata atau email user");
    }

    // Update data admin di tabel "admin"
    const { error: dbError } = await supabase
        .from("admin")
        .update({ first_name, last_name, email, photo, role })
        .eq("user_id", user_id);

    if (dbError) {
        console.error("Gagal update DB admin:", dbError.message);
        throw new Error("Gagal update data admin");
    }

    // Kalau semua berhasil
    return { message: "Admin berhasil diperbarui" };
};

module.exports = { editAdmin };

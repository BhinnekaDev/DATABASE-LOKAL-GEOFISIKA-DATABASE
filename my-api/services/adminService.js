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
        throw new Error("Gagal memperbarui Auth. Cek kembali user ID.");
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

// Fungsi untuk delete data admin (Auth dan tabel admin)
const deleteAdmin = async (user_id) => {
    // Hapus user di bagian Auth Supabase
    const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
    if (authError) {
        console.error("Gagal hapus user di Auth:", authError.message);
        throw new Error(
            "Gagal menghapus admin dari Auth. Cek kembali user ID."
        );
    }

    // Hapus data admin di tabel "admin"
    const { error: dbError } = await supabase
        .from("admin")
        .delete()
        .eq("user_id", user_id);

    if (dbError) {
        console.error("Gagal hapus data admin di DB:", dbError.message);
        throw new Error("Gagal menghapus data admin dari database.");
    }

    // Kalau semua berhasil
    return { message: "Admin berhasil dihapus" };
};

module.exports = { editAdmin, deleteAdmin };

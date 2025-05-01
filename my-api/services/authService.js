// services/authService.js
require("request-ip");
const { createClient } = require("@supabase/supabase-js");
const { DateTime } = require("luxon");

// Inisialisasi Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Registrasi admin baru
const signUp = async (email, password, first_name, last_name, photo, role) => {
    try {
        // Cek apakah email sudah terdaftar
        const { data: existing, error: checkError } = await supabase
            .from("admin")
            .select("email")
            .eq("email", email)
            .maybeSingle();

        if (checkError)
            throw new Error("Gagal cek email: " + checkError.message);
        if (existing) throw new Error("Email sudah digunakan.");

        // Buat akun Supabase Auth
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(error.message);

        const userId = data.user.id;
        const displayName = `${first_name} ${last_name}`;

        // Perbarui display name
        const { error: updateError } = await supabase.auth.updateUser({
            data: { display_name: displayName },
        });
        if (updateError)
            throw new Error("Gagal update nama: " + updateError.message);

        // Simpan ke tabel admin
        const { error: insertError } = await supabase.from("admin").insert({
            user_id: userId,
            email,
            first_name,
            last_name,
            photo,
            role,
        });
        if (insertError) {
            await supabase.auth.admin.deleteUser(userId); // Hapus akun jika gagal simpan data admin
            throw new Error("Gagal simpan ke admin: " + insertError.message);
        }

        return data;
    } catch (error) {
        throw error;
    }
};

// Simpan log login admin
const addLoginLog = async (adminId, ipAddress, userAgent) => {
    const localTime = DateTime.now()
        .setZone("Asia/Jakarta")
        .toLocaleString(DateTime.DATETIME_FULL);
    const { error } = await supabase.from("login_log").upsert(
        {
            admin_id: adminId,
            ip_address: ipAddress,
            login_time: localTime,
            user_agent: userAgent,
        },
        { onConflict: ["admin_id"] }
    );

    if (error) throw new Error("Gagal simpan log login: " + error.message);
};

// Login admin
const signIn = async (email, password, req) => {
    if (!req || !req.headers) {
        throw new Error("Request tidak valid.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw new Error(error.message);

    const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    if (!ipAddress) throw new Error("IP tidak ditemukan.");

    await addLoginLog(data.user.id, ipAddress, userAgent); // Simpan log login

    return data;
};

// Ambil role admin dari tabel `admin`
const getUserRole = async (user_id) => {
    const { data, error } = await supabase
        .from("admin")
        .select("role")
        .eq("user_id", user_id)
        .single();

    if (error) throw new Error(error.message);

    return data?.role;
};

module.exports = {
    signUp,
    signIn,
    getUserRole,
};

require("request-ip");
const { DateTime } = require("luxon");
const { createClient } = require("@supabase/supabase-js");

// Inisialisasi Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fungsi signup
const signUp = async (email, password, first_name, last_name, photo, role) => {
    try {
        // Registrasi user di Supabase
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            throw new Error(error.message);
        }

        const userId = data.user.id;

        // Menambahkan display_name di profil pengguna
        const displayName = `${first_name} ${last_name}`;
        const { error: updateError } = await supabase.auth.updateUser({
            data: { display_name: displayName },
        });

        if (updateError) {
            throw new Error(
                "Gagal memperbarui display_name: " + updateError.message
            );
        }

        // Masukkan data ke tabel admin
        const { error: insertError } = await supabase.from("admin").insert({
            user_id: userId,
            first_name,
            last_name,
            photo,
            role,
        });

        if (insertError) {
            // Jika ada error saat insert ke tabel admin, buang user dari auth dan lempar error
            await supabase.auth.admin.deleteUser(userId);
            throw new Error(
                "Gagal memasukkan data ke tabel admin: " + insertError.message
            );
        }

        return data;
    } catch (error) {
        throw error;
    }
};

// Fungsi addLoginLog
const addLoginLog = async (adminId, ipAddress, userAgent) => {
    // Waktu server lokal (WIB)
    const localTime = DateTime.now()
        .setZone("Asia/Jakarta")
        .toLocaleString(DateTime.DATETIME_FULL);

    // Gunakan upsert untuk insert atau update
    const { error } = await supabase.from("login_log").upsert(
        {
            admin_id: adminId,
            ip_address: ipAddress,
            login_time: localTime, // Set waktu login sekarang
            user_agent: userAgent,
        },
        { onConflict: ["admin_id"] } // Jika admin_id sudah ada, lakukan update
    );

    if (error) {
        throw new Error("Gagal menyimpan log login: " + error.message);
    }
};

// Fungsi signin
const signIn = async (email, password, req) => {
    if (!req || !req.headers) {
        throw new Error("Request object is missing or malformed.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw new Error(error.message);

    // Mengambil IP address dari headers
    const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    if (!ipAddress) {
        throw new Error("IP Address tidak ditemukan.");
    }

    // Menyimpan log login
    await addLoginLog(data.user.id, ipAddress, userAgent);

    return data;
};

// Fungsi ambil role dari tabel `admin`
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

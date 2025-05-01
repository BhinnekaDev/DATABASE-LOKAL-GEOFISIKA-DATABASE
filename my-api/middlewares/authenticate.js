const { createClient } = require("@supabase/supabase-js");

// Inisialisasi Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Middleware untuk autentikasi berdasarkan token
const authenticate = async (req, res, next) => {
    // Mengambil token dari header Authorization
    const token = req.headers.authorization?.split(" ")[1];

    // Jika token tidak ditemukan, kembalikan error 401
    if (!token) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    // Verifikasi token menggunakan Supabase
    const { data, error } = await supabase.auth.getUser(token);

    // Jika ada error dalam verifikasi token, kembalikan error 401
    if (error) {
        return res.status(401).json({ message: "Token tidak valid" });
    }

    // Menyimpan data user pada request untuk digunakan di middleware selanjutnya
    req.user = data.user;

    // Lanjut ke middleware berikutnya
    next();
};

module.exports = authenticate;

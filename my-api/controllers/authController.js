const authService = require("@services/authService");
const activityLogService = require("@services/activityLogService");

const { DateTime } = require("luxon");

// Fungsi untuk registrasi pengguna baru
const register = async (req, res) => {
    const { email, password, first_name, last_name, photo, role } = req.body;

    try {
        // Registrasi pengguna baru melalui authService
        const data = await authService.signUp(
            email,
            password,
            first_name,
            last_name,
            photo,
            role
        );

        // Membuat activity log untuk mencatat tindakan pendaftaran
        DateTime.now()
            .setZone("Asia/Jakarta") // Set zona waktu Jakarta
            .toLocaleString(DateTime.DATETIME_FULL);

        // Mendapatkan informasi IP address dan user agent untuk log
        const ipAddress =
            req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"];

        // Menambahkan log aktivitas ke dalam database
        await activityLogService.addActivityLog(
            data.user.id, // ID pengguna yang baru dibuat
            "DAFTAR", // Jenis aktivitas
            `Admin baru dengan email ${email} berhasil didaftarkan`, // Deskripsi aktivitas
            ipAddress, // Alamat IP pengguna
            userAgent // User agent browser atau client
        );

        // Mengirimkan response sukses dengan data pengguna
        return res.status(201).json({
            message: "Admin berhasil dibuat",
            user: data.user, // Data pengguna yang baru didaftarkan
        });
    } catch (error) {
        // Menangani error jika pendaftaran gagal
        return res.status(400).json({ message: error.message });
    }
};

// Fungsi untuk login pengguna
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Proses login pengguna melalui authService
        const data = await authService.signIn(email, password, req);

        // Mengambil role pengguna berdasarkan user_id
        const userRole = await authService.getUserRole(data.user.id);

        // Mengirimkan response dengan token akses dan informasi pengguna
        res.status(200).json({
            message: "Login berhasil",
            access_token: data.session.access_token, // Token untuk autentikasi
            user_id: data.user.id, // ID pengguna
            role: userRole, // Role pengguna (admin, user, dll)
        });
    } catch (error) {
        // Menangani error jika login gagal
        return res.status(401).json({ message: error.message });
    }
};

module.exports = { register, login }; // Mengekspor fungsi register dan login

const authService = require("@services/authService");
const activityLogService = require("@services/activityLogService");

const { DateTime } = require("luxon");

// Controller untuk pendaftaran admin
const register = async (req, res) => {
    const { email, password, first_name, last_name, photo, role } = req.body;

    try {
        // Registrasi admin baru melalui authService
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
            data.user.id, // ID admin yang baru dibuat
            "DAFTAR", // Jenis aktivitas
            `Admin baru dengan email ${email} berhasil didaftarkan`, // Deskripsi aktivitas
            ipAddress, // Alamat IP admin
            userAgent // User agent browser atau client
        );

        // Mengirimkan response sukses dengan data admin
        return res.status(201).json({
            message: "Admin berhasil dibuat",
            user: data.user, // Data admin yang baru didaftarkan
        });
    } catch (error) {
        // Menangani error jika pendaftaran gagal
        return res.status(400).json({ message: error.message });
    }
};

// Controller untuk proses login admin
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Proses login admin melalui authService
        const data = await authService.signIn(email, password, req);

        // Mengambil role admin berdasarkan user_id
        const userRole = await authService.getUserRole(data.user.id);

        // Mengirimkan response dengan token akses dan informasi admin
        res.status(200).json({
            message: "Login berhasil",
            access_token: data.session.access_token, // Token untuk autentikasi
            user_id: data.user.id, // ID admin
            role: userRole, // Role admin (admin, user, dll)
        });
    } catch (error) {
        // Menangani error jika login gagal
        return res.status(401).json({ message: error.message });
    }
};

module.exports = { register, login }; // Mengekspor fungsi register dan login

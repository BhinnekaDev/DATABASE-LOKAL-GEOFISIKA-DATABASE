// controllers/authController.js
const authService = require("../services/authService");

// Fungsi untuk registrasi pengguna baru
const register = async (req, res) => {
    const { email, password, first_name, last_name, photo, role } = req.body;

    try {
        // Mendaftar pengguna baru menggunakan authService
        const data = await authService.signUp(
            email,
            password,
            first_name,
            last_name,
            photo,
            role
        );

        return res.status(201).json({
            message: "Admin berhasil dibuat",
            user: data.user,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Fungsi untuk login pengguna
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Pastikan req object disertakan dengan benar
        const data = await authService.signIn(email, password, req); // req is passed here

        // Mengambil role pengguna berdasarkan user_id
        const userRole = await authService.getUserRole(data.user.id);

        // Mengirimkan response dengan token akses, user_id, dan role pengguna
        res.status(200).json({
            message: "Login berhasil",
            access_token: data.session.access_token,
            user_id: data.user.id,
            role: userRole,
        });
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
};

module.exports = { register, login }; // Mengekspor fungsi register dan login

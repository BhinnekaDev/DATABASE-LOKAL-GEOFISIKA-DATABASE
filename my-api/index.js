// Aktifkan module-alias untuk menggunakan path alias
require("module-alias/register");

// Load variabel lingkungan dari .env
require("dotenv").config();

const express = require("express");
const authRoutes = require("@routes/authRoutes");
const { createClient } = require("@supabase/supabase-js");
const jsonMiddleware = require("@middlewares/bodyParser");

const app = express();
const port = 3000;

// Middleware untuk parsing JSON
app.use(jsonMiddleware);

// Inisialisasi Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
createClient(supabaseUrl, supabaseKey);

// Routing autentikasi
app.use("/auth", authRoutes);

// Jalankan server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});

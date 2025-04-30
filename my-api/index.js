// index.js
require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const authRoutes = require("./routes/authRoutes");

const app = express();
const port = 3000;

// Middleware untuk parsing JSON dalam request body
app.use(express.json());

// Inisialisasi Supabase dengan URL dan Key yang didapat dari environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
createClient(supabaseUrl, supabaseKey);

// Menggunakan routing untuk autentikasi dengan prefix '/auth'
app.use("/auth", authRoutes);

// Menjalankan server pada port yang telah ditentukan
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});

// Inisialisasi alias module dan variabel lingkungan
require("module-alias/register");
require("dotenv").config();

const express = require("express");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { createClient } = require("@supabase/supabase-js");

// Import middleware dan routes
const jsonMiddleware = require("@middlewares/bodyParser");
const authRoutes = require("@routes/authRoutes");
const adminRoutes = require("@routes/adminRoutes");
const evaporationRoutes = require("@routes/evaporationRoutes");

const app = express();
const port = 3000;

// Gunakan middleware untuk parsing JSON
app.use(jsonMiddleware);

// Inisialisasi Supabase client (opsional jika tidak digunakan langsung di sini)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
createClient(supabaseUrl, supabaseKey);

// Konfigurasi Swagger untuk dokumentasi API
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Dokumentasi Lokal Database Geofisika",
            version: "1.0.0",
            description:
                "Dokumentasi endpoint API untuk Database Lokal Geofisika",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },
    apis: ["./docs/*.js"], // Lokasi file dokumentasi Swagger
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Endpoint dokumentasi Swagger
app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customCss: ` /* Kustomisasi tampilan Swagger UI */
            .swagger-ui .topbar { display: none; }
            .swagger-ui .info { display: none; }
            .swagger-ui .information-container {
                scrollbar-width: thin;
                scrollbar-color: #6c757d #f8f9fa;
            }
            .swagger-ui .information-container::-webkit-scrollbar {
                width: 8px;
            }
            .swagger-ui .information-container::-webkit-scrollbar-thumb {
                background-color: #6c757d;
                border-radius: 10px;
            }
            .swagger-ui .information-container::-webkit-scrollbar-track {
                background-color: #f8f9fa;
            }
        `,
    })
);

// Daftarkan route API
app.use("/auth", authRoutes); // Route autentikasi
app.use("/admin", adminRoutes); // Route admin
app.use("/evaporation", evaporationRoutes); // Route data evaporation

// Jalankan server
app.listen(port, () => {
    console.log(
        `Dokumentasi Lokasi Database Geofisika: http://localhost:${port}/docs`
    );
});

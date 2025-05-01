require("module-alias/register");
require("dotenv").config();

const express = require("express");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const authRoutes = require("@routes/authRoutes");
const { createClient } = require("@supabase/supabase-js");
const jsonMiddleware = require("@middlewares/bodyParser");

const app = express();
const port = 3000;

app.use(jsonMiddleware);

// Inisialisasi Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
createClient(supabaseUrl, supabaseKey);

// Swagger setup
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
    apis: ["./docs/*.js"],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);
app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        deepLinking: false,
        docExpansion: "none",
        customCss: `
            .swagger-ui .topbar { display: none; }

            .swagger-ui .info { display: none; }

            .swagger-ui .swagger-ui .information-container {
                scrollbar-width: thin;
                scrollbar-color: #6c757d #f8f9fa;
            }

            .swagger-ui .swagger-ui .information-container::-webkit-scrollbar {
                width: 8px;
            }

            .swagger-ui .swagger-ui .information-container::-webkit-scrollbar-thumb {
                background-color: #6c757d;
                border-radius: 10px;
            }

            .swagger-ui .swagger-ui .information-container::-webkit-scrollbar-track {
                background-color: #f8f9fa;
            }
        `,
    })
);

// Routing autentikasi
app.use("/auth", authRoutes);

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
    console.log(`Dokumentasi Swagger: http://localhost:${port}/docs`);
});

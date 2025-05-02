// services/evaporationService.js

// Inisialisasi Supabase client dengan key khusus untuk layanan (service key)
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY_SERVICE
);

// Fungsi untuk menyimpan data evaporation beserta tanggalnya
const insertEvaporationData = async ({ date, evaporation }) => {
    // Insert data tanggal ke tabel date_data dan ambil id-nya
    const { data: dateData, error: dateError } = await supabase
        .from("date_data")
        .insert([{ date }])
        .select("id")
        .single();

    if (dateError) {
        throw new Error(`Error inserting date data: ${dateError.message}`);
    }

    const id_date = dateData.id;

    // Insert data evaporation dengan relasi ke id_date
    const { data: evaporationInserted, error: evaporationError } =
        await supabase
            .from("evaporation")
            .insert([{ id_date, evaporation }])
            .select("*");

    if (evaporationError) {
        throw new Error(
            `Error inserting evaporation data: ${evaporationError.message}`
        );
    }

    // Kembalikan data hasil insert
    return evaporationInserted;
};

module.exports = { insertEvaporationData };

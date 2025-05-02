// services/evaporationService.js

// Inisialisasi Supabase client dengan key khusus untuk layanan (service key)
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY_SERVICE
);

// Fungsi untuk mendapatkan data evaporation berdasarkan id
const getEvaporationDataById = async (id_date) => {
    const { data: evaporationData, error: evaporationError } = await supabase
        .from("evaporation")
        .select("*")
        .eq("id_date", id_date)
        .single();

    if (evaporationError) {
        console.error("Error fetching evaporation data:", evaporationError);
        throw new Error(
            `Error fetching evaporation data: ${evaporationError.message}`
        );
    }

    // Kembalikan data evaporation
    return evaporationData;
};

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

// Fungsi untuk menyunting data evaporation beserta tanggalnya
const editEvaporationData = async ({ id_date, date, evaporation }) => {
    // Update data pada tabel date_data
    const { data: updatedDateData, error: dateError } = await supabase
        .from("date_data")
        .update({ date })
        .eq("id", id_date)
        .select("id")
        .single();

    if (dateError) {
        throw new Error(`Error updating date data: ${dateError.message}`);
    }

    // Update data evaporation pada tabel evaporation
    const { data: updatedEvaporation, error: evaporationError } = await supabase
        .from("evaporation")
        .update({ evaporation })
        .eq("id_date", id_date)
        .select("evaporation")
        .single();

    if (evaporationError) {
        throw new Error(
            `Error updating evaporation data: ${evaporationError.message}`
        );
    }

    // Kembalikan data yang telah diperbarui
    return { updatedDateData, updatedEvaporation };
};

module.exports = {
    insertEvaporationData,
    editEvaporationData,
    getEvaporationDataById,
};

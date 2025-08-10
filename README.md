
---

# 🛠️ Lokal Database Geofisika Bengkulu - Bhinneka Developer

**Backend API untuk pengelolaan data geofisika lokal Bengkulu**
Dibangun modular dan scalable menggunakan **NestJS** dan **Supabase**.

> Backend ini menyediakan data dan layanan API untuk mendukung riset, monitoring, dan aplikasi berbasis data geofisika di wilayah Bengkulu.

[![GitHub Repo](https://img.shields.io/badge/github-BhinnekaDev-blue?logo=github\&style=flat-square)](https://github.com/BhinnekaDev/DATABASE-LOKAL-GEOFISIKA-DATABASE)

![Platform](https://img.shields.io/badge/platform-API-blue?style=flat-square)
![NestJS](https://img.shields.io/badge/NestJS-9-red?logo=nestjs\&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-3178C6?logo=typescript\&logoColor=white\&style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase\&style=flat-square)

---

## 🚀 Fitur Utama

| **Modul**                | **Deskripsi dan Fungsi Utama**                                                       |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **Autentikasi Pengguna** | Sistem register & login aman menggunakan Supabase Auth (JWT). Menjaga keamanan data. |
| **Swagger API Docs**     | Dokumentasi API interaktif tersedia otomatis di `/api`, memudahkan eksplorasi API.   |
| **Struktur Modular**     | Arsitektur modular NestJS yang mudah dikembangkan dan di-maintain.                   |
| **CRUD Data Geofisika**  | Fitur Create, Read, Update, Delete (CRUD) lengkap untuk berbagai data geofisika seperti suhu, tekanan udara, curah hujan, kelembaban, dan lain-lain. Memudahkan pengelolaan data secara realtime dan terstruktur.              |

---

## ⚙️ Teknologi

| Layer       | Stack                                           | Keterangan Singkat                                    |
| ----------- | ----------------------------------------------- | ----------------------------------------------------- |
| **Backend** | NestJS, TypeScript, Supabase (PostgreSQL, Auth) | Framework modern dan database realtime yang powerful. |
| **Deploy**  | Docker-ready, Railway, Portainer (opsional)     | Mempermudah deployment dan monitoring layanan.        |

---

## 📦 Instalasi

```bash
# Clone repo
git clone https://github.com/BhinnekaDev/DATABASE-LOKAL-GEOFISIKA-DATABASE.git
cd DATABASE-LOKAL-GEOFISIKA-DATABASE

# Install dependencies
npm install
```

Buat file `.env` di root project dengan konfigurasi:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> 🔐 Ambil data dari Supabase Project Settings.

Jalankan server:

```bash
npm run start
```

Akses:

* API: [http://localhost:3000](http://localhost:3000)
* Dokumentasi Swagger: [http://localhost:3000/api](http://localhost:3000/api)

---

## 🗂️ Struktur Proyek & Keterangan Modul

```
src/
├── activity-log/          # Mencatat aktivitas sistem dan pengguna untuk audit dan monitoring
├── admin/                 # Modul untuk manajemen admin dan otorisasi akses
├── air-pressure/          # Pengolahan data tekanan udara dari sensor lokal
├── auth/                  # Autentikasi pengguna dengan Supabase dan JWT
├── average-temperature/   # Mengolah data suhu rata-rata harian wilayah Bengkulu
├── earthquake/            # Pengelolaan data gempa dan historisnya di wilayah pengamatan
├── evaporation/           # Analisis data evaporasi untuk pemantauan kondisi lingkungan
├── helpers/               # Fungsi utilitas yang digunakan di berbagai modul
├── humidity/              # Data dan analisis kelembaban udara dari sensor
├── lightning/             # Data petir dan pengolahannya di wilayah Bengkulu
├── login-log/             # Riwayat login pengguna, penting untuk keamanan
├── max-temperature/       # Data suhu maksimum harian, membantu analisis cuaca ekstrem
├── microthermor/          # Sensor microthermor: data suhu mikro detail
├── min-temperature/       # Data suhu minimum harian, menunjang analisis iklim mikro
├── rain-gauge/            # Data pengukuran curah hujan menggunakan rain gauge
├── rain-intensity/        # Pengolahan data intensitas hujan untuk monitoring
├── rainfall/              # Rekapitulasi data curah hujan harian dan bulanan
├── rainy-days/            # Statistik hari hujan untuk periode tertentu
├── sunshine-duration/     # Data durasi penyinaran matahari, berguna untuk agrikultur
├── time-signature/        # Modul untuk penanganan data waktu dan timestamp
├── wind-direction/        # Data arah angin dari sensor lokal
├── main.ts                # Entry point aplikasi backend
└── app.module.ts          # Root module yang mengatur seluruh modul aplikasi
```

---

## 🧪 Script Penting

| Perintah            | Keterangan                       |
| ------------------- | -------------------------------- |
| `npm run start`     | Jalankan server mode production  |
| `npm run start:dev` | Jalankan server mode development |
| `npm run build`     | Build project ke folder `/dist`  |
| `npm run lint`      | Periksa dan perbaiki format kode |
| `npm run test`      | Jalankan unit testing            |
| `npm run test:e2e`  | Jalankan end-to-end testing      |

---

## 🤝 Kontribusi

1. Fork repo ini
2. Buat branch fitur/bugfix baru
3. Gunakan commit yang jelas dan deskriptif
4. Jalankan `npm run lint` sebelum submit pull request

---

## 📜 Lisensi

MIT © 2025 Bhinneka Developer

---

Dikelola oleh Bhinneka Developer – 2025

---

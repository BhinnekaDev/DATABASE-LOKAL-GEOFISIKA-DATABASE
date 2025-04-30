# 📡 DATABASE LOKAL GEOFISIKA — RESTful API oleh Bhinneka Dev

Selamat datang di backend API untuk **Database Lokal Geofisika**, dikembangkan oleh tim **Bhinneka Dev**.
Modul ini merupakan fondasi awal untuk sistem otentikasi pengguna dan akan berkembang ke pengelolaan data geofisika dan monitoring aktivitas sistem.

---

## 🚀 Cara Menjalankan

### 1. Fork & Clone Repositori
```bash
git clone https://github.com/username/DATABASE-LOKAL-GEOFISIKA-DATABASE.git
cd DATABASE-LOKAL-GEOFISIKA-DATABASE
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment
Buat file `.env` dan isi seperti berikut:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 4. Jalankan Server
```bash
node index.js
```
Server akan berjalan di `http://localhost:3000`

---

## 🔐 Endpoint Autentikasi

**Base URL:** `http://localhost:3000/auth`

### 📝 POST `/register`
> Registrasi admin baru.

**Body JSON:**
```json
{
  "email": "admin@email.com",
  "password": "rahasia123",
  "first_name": "Budi",
  "last_name": "Santoso",
  "photo": "https://link-foto.com/budi.jpg",
  "role": "admin"
}
```

### 🔑 POST `/login`
> Login dan log aktivitas admin.

**Body JSON:**
```json
{
  "email": "admin@email.com",
  "password": "rahasia123"
}
```

**Respons:**
```json
{
  "message": "Login berhasil",
  "access_token": "token...",
  "user_id": "uuid...",
  "role": "admin"
}
```

---

## 🧱 Teknologi yang Digunakan

- **Node.js + Express** – Server backend
- **Supabase** – Autentikasi & database
- **Luxon** – Zona waktu lokal (WIB)
- **request-ip** – Logging alamat IP

---

## 📌 Catatan

- Sistem ini masih dalam tahap awal (fase autentikasi).
- Akan dikembangkan fitur seperti:
  - Manajemen data geofisika
  - Dashboard admin & pengguna
  - Log aktivitas lengkap
  - Integrasi file & media

---

## 🤝 Tim Pengembang

**Bhinneka Dev**
_Membangun solusi data geofisika yang terintegrasi & efisien._

---

## 📬 Kontak

Buka _issue_ atau hubungi kami untuk pertanyaan dan masukan.

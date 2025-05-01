# 📡 **DATABASE LOKAL GEOFISIKA — RESTful API**
**Dikembangkan oleh Bhinneka Dev**

Selamat datang di backend API untuk **Database Lokal Geofisika**, solusi terintegrasi yang dikembangkan oleh tim **Bhinneka Dev**.
Modul ini berfungsi sebagai fondasi awal untuk sistem otentikasi pengguna dan akan terus berkembang menuju pengelolaan data geofisika dan monitoring aktivitas sistem.

---

## 🚀 **Cara Menjalankan Proyek**

### 1. **Fork & Clone Repositori**
Pertama, fork dan clone repositori ini ke mesin lokal Anda.
```bash
git clone https://github.com/username/DATABASE-LOKAL-GEOFISIKA-DATABASE.git
cd DATABASE-LOKAL-GEOFISIKA-DATABASE
```

### 2. **Instalasi Dependensi**
Install semua dependensi yang dibutuhkan.
```bash
npm install
```

### 3. **Konfigurasi Environment**
Buat file `.env` di root folder proyek dan tambahkan konfigurasi berikut:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 4. **Jalankan Server**
Untuk memulai server, jalankan perintah berikut:
```bash
node index.js
```
Server akan berjalan di `http://localhost:3000`.

---

## 🔐 **Endpoint Autentikasi**

**Base URL:** `http://localhost:3000/auth`

Setiap endpoint autentikasi sudah dilengkapi dengan validasi melalui middleware, untuk memastikan data yang diterima sudah terformat dengan benar dan lengkap.

---

### 📝 **POST /register**
**Deskripsi:** Registrasi admin baru.

**Body JSON:**
```json
{
  "email": "admin@gmail.com",
  "password": "rahasia123.",
  "first_name": "Bhinneka",
  "last_name": "Developer",
  "photo": "https://link-foto.com/bhinnekaDev.jpg",
  "role": "admin"
}
```

**Validasi:**
- `email` harus dalam format email yang valid.
- `password` minimal 6 karakter.
- Semua field wajib diisi.

**Keamanan:**
Password akan dienkripsi sebelum disimpan untuk memastikan data tetap aman. Selain itu, setiap aktivitas seperti registrasi akan tercatat dalam **activity log** untuk memantau aktivitas sistem.

---

### 🔑 **POST /login**
**Deskripsi:** Login dan log aktivitas admin.

**Body JSON:**
```json
{
  "email": "admin@gmail.com",
  "password": "rahasia123."
}
```

**Respons Sukses:**
```json
{
  "message": "Login berhasil",
  "access_token": "token...",
  "user_id": "uuid...",
  "role": "admin"
}
```

**Validasi:**
- `email` dan `password` wajib diisi dan valid.

**Keamanan:**
- Sistem menggunakan **Supabase** untuk autentikasi, sehingga Anda tidak perlu menangani token JWT secara manual. Supabase akan mengelola token dan autentikasi pengguna secara otomatis.
- Aktivitas login juga akan tercatat untuk keamanan dan audit sistem.

---

## 🧱 **Teknologi yang Digunakan**

- **Node.js + Express** – Backend server
- **Supabase** – Autentikasi & database
- **Luxon** – Zona waktu lokal (WIB)
- **request-ip** – Logging alamat IP pengguna
- **express-validator** – Validasi request body

---

## 📌 **Catatan**

- Sistem ini saat ini berfokus pada autentikasi pengguna, dengan rencana pengembangan untuk:
  - Manajemen data geofisika
  - Dashboard untuk admin & pengguna
  - Log aktivitas yang lebih lengkap
  - Integrasi file dan media

**Keamanan:**
- **Supabase** menangani autentikasi dan token secara aman, dengan memastikan bahwa hanya pengguna yang terotorisasi yang dapat mengakses endpoint yang dilindungi.
- **Middleware** telah disiapkan untuk melindungi endpoint, sehingga hanya request yang valid yang bisa diterima.

---

## 🤝 **Tim Pengembang**

**Bhinneka Dev**
_Membangun solusi data geofisika yang terintegrasi dan efisien._

---

## 📬 **Kontak**

Jika Anda memiliki pertanyaan atau masukan, jangan ragu untuk membuka **issue** di GitHub atau menghubungi kami langsung.

---

### **Keamanan:**

1. **Autentikasi dengan Supabase:**
   Proyek ini mengandalkan **Supabase** untuk autentikasi pengguna, yang menangani pembuatan dan verifikasi token otomatis. Anda tidak perlu mengelola JWT secara manual.

2. **Middleware `authenticate`:**
   Middleware ini memastikan bahwa setiap permintaan ke endpoint yang dilindungi telah mengirimkan token valid dari Supabase. Tanpa token yang valid, akses akan ditolak.

3. **Validasi Input:**
   Sebelum data diteruskan ke server, semua data pengguna akan divalidasi menggunakan **express-validator**, memastikan bahwa informasi yang diterima sudah terformat dengan benar dan aman.

4. **Keamanan Data Pengguna:**
   Semua password pengguna dienkripsi sebelum disimpan, dan setiap aktivitas penting, seperti registrasi dan login, tercatat untuk audit dan keamanan.

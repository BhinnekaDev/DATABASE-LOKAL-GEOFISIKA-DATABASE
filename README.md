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

## 🧱 **Teknologi yang Digunakan**

- **Node.js + Express** – Backend server
- **Supabase** – Autentikasi & database
- **Luxon** – Zona waktu lokal (WIB)
- **request-ip** – Logging alamat IP pengguna
- **express-validator** – Validasi request body

---

## 🤝 **Tim Pengembang**

**Bhinneka Dev**
_Membangun solusi data geofisika yang terintegrasi dan efisien._

---

## 📬 **Kontak**

Jika Anda memiliki pertanyaan atau masukan, jangan ragu untuk membuka **issue** di GitHub atau menghubungi kami langsung.

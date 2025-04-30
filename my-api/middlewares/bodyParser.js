const express = require("express");

// Membuat middleware untuk parsing body request yang bertipe JSON
// Middleware ini akan membaca JSON dari body dan mengubahnya menjadi objek JavaScript
const jsonMiddleware = express.json();

// Mengekspor middleware agar bisa digunakan di file lain, misalnya di index.js
module.exports = jsonMiddleware;

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>API Lokal Database Geofisika</title>
        <link rel="icon" type="image/x-icon" href="https://img.icons8.com/fluency/48/api.png" />
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(to right, #0f2027, #203a43, #2c5364);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          h1 {
            font-size: 3rem;
            margin-bottom: 0.5rem;
          }
          p {
            font-size: 1.2rem;
            max-width: 600px;
          }
          a {
            margin-top: 1.5rem;
            padding: 10px 20px;
            background-color: #00b894;
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            transition: background 0.3s ease;
          }
          a:hover {
            background-color: #019875;
          }
        </style>
      </head>
      <body>
        <h1>🌍 API Lokal Database Geofisika</h1>
        <p>Selamat datang di API lokal untuk sistem informasi geofisika. Akses endpoint, autentikasi, dan fitur log tersedia di sini.</p>
        <a href="/api">📄 Lihat Dokumentasi</a>
      </body>
      </html>
    `;
  }
}

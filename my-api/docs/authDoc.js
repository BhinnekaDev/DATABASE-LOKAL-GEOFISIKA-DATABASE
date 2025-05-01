/**
 * @swagger
 * tags:
 *   name: Autentikasi
 *   description: Endpoints untuk autentikasi admin atau operator
 *
 * /auth/register:
 *   post:
 *     summary: Registrasi admin atau operator baru
 *     tags: [Autentikasi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: bhinnekaDev@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Rahasia123.
 *               first_name:
 *                 type: string
 *                 example: Bhinneka
 *               last_name:
 *                 type: string
 *                 example: Developer
 *               photo:
 *                 type: string
 *                 example: https://example.com/bhinnekaDev.jpg
 *               role:
 *                 type: string
 *                 example: admin
 *     responses:
 *       201:
 *         description: Registrasi berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin berhasil dibuat
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 12345
 *                     email:
 *                       type: string
 *                       example: bhinnekaDev@gmail.com
 *                     first_name:
 *                       type: string
 *                       example: Bhinneka
 *                     last_name:
 *                       type: string
 *                       example: Developer
 *                     role:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Validasi gagal
 *       500:
 *         description: Kesalahan server
 *
 * /auth/login:
 *   post:
 *     summary: Login admin atau operator
 *     tags: [Autentikasi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: bhinnekaDev@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Rahasia123.
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login berhasil
 *                 access_token:
 *                   type: string
 *                   example: your-access-token
 *                 user_id:
 *                   type: string
 *                   example: 12345
 *                 role:
 *                   type: string
 *                   example: admin
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Autentikasi gagal
 *       429:
 *         description: Terlalu banyak percobaan login
 *       500:
 *         description: Kesalahan server
 */

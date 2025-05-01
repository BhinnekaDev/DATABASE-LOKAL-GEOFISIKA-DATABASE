/**
 * @swagger
 * tags:
 *   name: Admin Atau Operator
 *   description: Endpoints untuk CRUD admin atau operator
 *
 * /admin/edit/{user_id}:
 *   put:
 *     summary: Edit data admin atau operator
 *     tags: [Admin Atau Operator]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: UUID dari admin yang ingin diperbarui
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: bhinnekaBaru@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: RahasiaBaru123..
 *               first_name:
 *                 type: string
 *                 example: Bhinneka Baru
 *               last_name:
 *                 type: string
 *                 example: Dev Baru
 *               photo:
 *                 type: string
 *                 example: https://example.com/bhinnekaTerbaru.jpg
 *               role:
 *                 type: string
 *                 example: operator
 *     responses:
 *       200:
 *         description: Data admin berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin berhasil diperbarui
 *       400:
 *         description: Validasi gagal atau format UUID tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: user_id harus berupa UUID yang valid
 *       500:
 *         description: Kesalahan server
 */

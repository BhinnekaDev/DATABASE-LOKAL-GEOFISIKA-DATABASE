/**
 * @swagger
 * tags:
 *   name: Evaporation
 *   description: Endpoints untuk CRUD data evaporation
 *
 * /evaporation/insert/{user_id}:
 *   post:
 *     summary: Menambahkan data evaporation baru
 *     description: Menambahkan data evaporation dengan tanggal tertentu ke dalam sistem.
 *     tags: [Evaporation]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: UUID dari admin atau operator yang menambahkan data evaporation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-02"
 *               evaporation:
 *                 type: number
 *                 example: 150.5
 *     responses:
 *       201:
 *         description: Data evaporation berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data evaporation berhasil ditambahkan
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 123
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2025-05-02"
 *                     evaporation:
 *                       type: number
 *                       example: 150.5
 *       400:
 *         description: Format data tidak valid atau request body salah
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data input tidak valid
 *       500:
 *         description: Terjadi kesalahan server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Terjadi kesalahan saat menambahkan data evaporation
 *
 * /evaporation/edit/{user_id}/{id_date}:
 *   put:
 *     summary: Mengedit data evaporation
 *     description: Mengubah data evaporation pada tanggal tertentu dalam sistem.
 *     tags: [Evaporation]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: UUID dari admin yang mengedit data evaporation
 *       - in: path
 *         name: id_date
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tanggal yang akan diubah datanya
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-02"
 *               evaporation:
 *                 type: number
 *                 example: 150.5
 *     responses:
 *       200:
 *         description: Data evaporation berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data evaporation berhasil diperbarui
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedDateData:
 *                       type: object
 *                       description: Data tanggal yang telah diperbarui
 *                     updatedEvaporation:
 *                       type: object
 *                       description: Data evaporation yang telah diperbarui
 *       400:
 *         description: Format data tidak valid atau request body salah
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data input tidak valid
 *       500:
 *         description: Terjadi kesalahan server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Terjadi kesalahan saat memperbarui data evaporation
 */

import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { restrictTo } from '../middleware/authMiddleware';
import AdminController from '../controllers/AdminController';

const router = express.Router();
const adminController = new AdminController();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Yönetici işlemleri için API uç noktaları
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Tüm kullanıcıları listele
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sayfa başına kullanıcı sayısı
 *     responses:
 *       200:
 *         description: Kullanıcılar başarıyla listelendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           username:
 *                             type: string
 *                           first_name:
 *                             type: string
 *                           last_name:
 *                             type: string
 *                           role:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                           updated_at:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         pages:
 *                           type: integer
 *                           example: 10
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       500:
 *         description: Sunucu hatası
 */
router.get('/users', authenticate, restrictTo('admin', 'superadmin'), adminController.listAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Belirli bir kullanıcının detaylarını getir
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kullanıcı ID
 *     responses:
 *       200:
 *         description: Kullanıcı detayları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     profile_picture:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/users/:id', authenticate, restrictTo('admin', 'superadmin'), adminController.getUserDetails);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Kullanıcı rolünü güncelle
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kullanıcı ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, superadmin]
 *                 description: Kullanıcının yeni rolü
 *     responses:
 *       200:
 *         description: Kullanıcı rolü başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Kullanıcı rolü başarıyla güncellendi
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Geçersiz rol
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.patch('/users/:id/role', authenticate, restrictTo('admin', 'superadmin'), adminController.updateUserRole);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Kullanıcı rolünü güncelle (PUT metodu)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kullanıcı ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, superadmin]
 *                 description: Kullanıcının yeni rolü
 *     responses:
 *       200:
 *         description: Kullanıcı rolü başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Kullanıcı rolü başarıyla güncellendi
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Geçersiz rol
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.put('/users/:id/role', authenticate, restrictTo('admin', 'superadmin'), adminController.updateUserRole);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Yeni kullanıcı oluştur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Kullanıcı email adresi
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Kullanıcı şifresi (min. 6 karakter)
 *               username:
 *                 type: string
 *                 description: Kullanıcı adı
 *               first_name:
 *                 type: string
 *                 description: Kullanıcı adı
 *               last_name:
 *                 type: string
 *                 description: Kullanıcı soyadı
 *               phone:
 *                 type: string
 *                 description: Telefon numarası
 *               role:
 *                 type: string
 *                 enum: [user, admin, superadmin]
 *                 description: Kullanıcı rolü (varsayılan: user)
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Kullanıcı başarıyla oluşturuldu
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     created_at:
 *                       type: string
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       500:
 *         description: Sunucu hatası
 */
router.post('/users', authenticate, restrictTo('admin', 'superadmin'), adminController.createUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Kullanıcıyı sil
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kullanıcı ID
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Kullanıcı başarıyla silindi
 *       400:
 *         description: İlişkili veri hatası
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.delete('/users/:id', authenticate, restrictTo('admin', 'superadmin'), adminController.deleteUser);

export default router; 
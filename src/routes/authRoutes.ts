import { Router } from 'express';
import { Request, Response } from 'express';
import { protect } from '../middleware/authMiddleware';
import { register, login, logout, resetPassword, getCurrentUser } from '../controllers/AuthController';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Yeni kullanıcı kaydı
 *     tags: [Auth]
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
 *               - first_name
 *               - last_name
 *               - phone
 *               - default_location_latitude
 *               - default_location_longitude
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               username:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               profile_picture:
 *                 type: string
 *               default_location_latitude:
 *                 type: number
 *               default_location_longitude:
 *                 type: number
 *               role:
 *                 type: string
 *                 enum: [admin, user, coach]
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla oluşturuldu
 *       400:
 *         description: Hatalı istek veya eksik parametreler
 *       500:
 *         description: Sunucu hatası
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Geçerli bir email adresi giriniz'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır'),
    body('username').notEmpty().withMessage('Kullanıcı adı gereklidir'),
    body('first_name').notEmpty().withMessage('İsim gereklidir'),
    body('last_name').notEmpty().withMessage('Soyisim gereklidir'),
    body('phone').notEmpty().withMessage('Telefon numarası gereklidir'),
    body('default_location_latitude').isNumeric().withMessage('Geçerli bir konum enlem değeri giriniz'),
    body('default_location_longitude').isNumeric().withMessage('Geçerli bir konum boylam değeri giriniz')
  ],
  validateRequest,
  register
);

/**
 * @swagger
 * /api/auth/register-admin:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Yeni admin veya süper admin kullanıcı kaydı
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
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *                 description: Kullanıcı adı (varsayılan olarak email'in @ işaretinden önceki kısmı kullanılır)
 *               role:
 *                 type: string
 *                 enum: [admin, superadmin]
 *                 default: admin
 *                 description: Kullanıcı rolü - admin veya superadmin
 *     responses:
 *       201:
 *         description: Admin kullanıcı başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz input
 */
router.post('/register-admin', authController.registerAdmin);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Kullanıcı girişi
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Başarılı giriş
 *       401:
 *         description: Hatalı giriş bilgileri
 *       500:
 *         description: Sunucu hatası
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Geçerli bir email adresi giriniz'),
    body('password').notEmpty().withMessage('Şifre gereklidir')
  ],
  validateRequest,
  login
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Kullanıcı çıkışı
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı çıkış
 *       401:
 *         description: Yetkilendirme hatası
 */
router.post('/logout', protect, logout);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Şifre sıfırlama
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Şifre sıfırlama bağlantısı gönderildi
 *       400:
 *         description: Geçersiz email
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Mevcut kullanıcı bilgilerini getir
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı bilgileri başarıyla getirildi
 *       401:
 *         description: Yetkilendirme hatası
 */
router.get('/me', protect, getCurrentUser);

export default router; 
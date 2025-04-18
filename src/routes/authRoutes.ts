import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { protect } from '../middleware/authMiddleware';
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

const router = Router();
const authController = new AuthController();
const authService = new AuthService();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Yeni kullanıcı kaydı
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
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz input
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Kullanıcı girişi
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
 *                 description: Kullanıcı adı (şu an için email adresi olmalıdır)
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Başarılı giriş
 *       401:
 *         description: Geçersiz kimlik bilgileri
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Kullanıcı çıkışı
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı çıkış
 *       401:
 *         description: Yetkilendirme hatası
 */
router.post('/logout', protect, authController.logout);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
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
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const result = await authService.resetPassword(req.body);
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }
        res.json({ message: 'Password reset email sent' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Mevcut kullanıcı bilgilerini getir
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı bilgileri başarıyla getirildi
 *       401:
 *         description: Yetkilendirme hatası
 */
router.get('/me', protect, authController.getCurrentUser);

router.get('/check-user/:email', async (req: Request, res: Response) => {
    try {
        const { exists, error } = await authService.checkUserExists(req.params.email);
        if (error) {
            return res.status(400).json({ error });
        }
        res.json({ exists });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 
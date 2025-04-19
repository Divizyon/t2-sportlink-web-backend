import { Router } from 'express';
import { AnnouncementController } from '../controllers/AnnouncementController';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = Router();
const announcementController = new AnnouncementController();

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     tags:
 *       - Announcements
 *     summary: Create a new announcement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/',
    protect,
    adminOnly,
    [
        body('title').notEmpty().withMessage('Başlık gereklidir'),
        body('content').notEmpty().withMessage('İçerik gereklidir'),
        body('isPublished').optional().isBoolean().withMessage('isPublished boolean olmalıdır'),
        body('startDate').optional().isISO8601().withMessage('Geçerli bir tarih formatı kullanınız'),
        body('endDate').optional().isISO8601().withMessage('Geçerli bir tarih formatı kullanınız'),
        validateRequest
    ],
    announcementController.createAnnouncement
);

/**
 * @swagger
 * /api/announcements/{id}:
 *   put:
 *     tags:
 *       - Announcements
 *     summary: Update an announcement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Announcement not found
 */
router.put(
    '/:id',
    protect,
    adminOnly,
    [
        body('title').optional(),
        body('content').optional(),
        body('isPublished').optional().isBoolean().withMessage('isPublished boolean olmalıdır'),
        body('startDate').optional().isISO8601().withMessage('Geçerli bir tarih formatı kullanınız'),
        body('endDate').optional().isISO8601().withMessage('Geçerli bir tarih formatı kullanınız'),
        validateRequest
    ],
    announcementController.updateAnnouncement
);

/**
 * @swagger
 * /api/announcements/{id}:
 *   delete:
 *     tags:
 *       - Announcements
 *     summary: Delete an announcement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Announcement not found
 */
router.delete('/:id', protect, adminOnly, announcementController.deleteAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}:
 *   get:
 *     tags:
 *       - Announcements
 *     summary: Get an announcement by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement retrieved successfully
 *       404:
 *         description: Announcement not found
 */
router.get('/:id', announcementController.getAnnouncementById);

/**
 * @swagger
 * /api/announcements/slug/{slug}:
 *   get:
 *     tags:
 *       - Announcements
 *     summary: Get an announcement by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement slug
 *     responses:
 *       200:
 *         description: Announcement retrieved successfully
 *       404:
 *         description: Announcement not found
 */
router.get('/slug/:slug', announcementController.getAnnouncementBySlug);

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     tags:
 *       - Announcements
 *     summary: Get a list of announcements
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Page size
 *       - in: query
 *         name: published
 *         schema:
 *           type: boolean
 *         description: Filter for published only
 *     responses:
 *       200:
 *         description: List of announcements
 */
router.get('/', announcementController.listAnnouncements);

/**
 * @swagger
 * /api/announcements/active:
 *   get:
 *     tags:
 *       - Announcements
 *     summary: Get active announcements
 *     responses:
 *       200:
 *         description: List of active announcements
 */
router.get('/active', announcementController.getActiveAnnouncements);

export default router; 
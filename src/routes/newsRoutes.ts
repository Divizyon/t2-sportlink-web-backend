import { Router } from 'express';
import { NewsController } from '../controllers/NewsController';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/adminAuthMiddleware';

const router = Router();
const newsController = new NewsController();

/**
 * @swagger
 * /api/news:
 *   post:
 *     tags:
 *       - News
 *     summary: Create a new news article
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
 *               summary:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: News article created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/',
    protect,
    [
        body('title').notEmpty().withMessage('Başlık gereklidir'),
        body('content').notEmpty().withMessage('İçerik gereklidir'),
        body('summary').optional(),
        body('imageUrl').optional(),
        body('isPublished').optional().isBoolean().withMessage('Yayın durumu boolean olmalıdır'),
        body('categoryIds').optional().isArray().withMessage('Kategoriler bir dizi olmalıdır'),
        validateRequest
    ],
    newsController.createNews
);

/**
 * @swagger
 * /api/news/{id}:
 *   put:
 *     tags:
 *       - News
 *     summary: Update a news article
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News article ID
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
 *               summary:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: News article updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: News article not found
 */
router.put(
    '/:id',
    protect,
    [
        body('title').optional(),
        body('content').optional(),
        body('summary').optional(),
        body('imageUrl').optional(),
        body('isPublished').optional().isBoolean().withMessage('Yayın durumu boolean olmalıdır'),
        body('categoryIds').optional().isArray().withMessage('Kategoriler bir dizi olmalıdır'),
        validateRequest
    ],
    newsController.updateNews
);

/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     tags:
 *       - News
 *     summary: Delete a news article
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News article ID
 *     responses:
 *       200:
 *         description: News article deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: News article not found
 */
router.delete('/:id', protect, newsController.deleteNews);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     tags:
 *       - News
 *     summary: Get a news article by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News article ID
 *     responses:
 *       200:
 *         description: News article retrieved successfully
 *       404:
 *         description: News article not found
 */
router.get('/:id', newsController.getNewsById);

/**
 * @swagger
 * /api/news/slug/{slug}:
 *   get:
 *     tags:
 *       - News
 *     summary: Get a news article by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: News article slug
 *     responses:
 *       200:
 *         description: News article retrieved successfully
 *       404:
 *         description: News article not found
 */
router.get('/slug/:slug', newsController.getNewsBySlug);

/**
 * @swagger
 * /api/news:
 *   get:
 *     tags:
 *       - News
 *     summary: Get a list of news articles
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
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of news articles
 */
router.get('/', newsController.getNewsList);

export default router; 
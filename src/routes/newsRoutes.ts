import { Router } from 'express';
import { NewsController } from '../controllers/NewsController';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { protect, adminOnly } from '../middleware/authMiddleware';
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
 *               - sport_id
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               source_url:
 *                 type: string
 *               image_url:
 *                 type: string
 *               published_date:
 *                 type: string
 *                 format: date-time
 *               sport_id:
 *                 type: string
 *               status:
 *                 type: integer
 *                 description: 0=devre dışı, 1=aktif
 *                 default: 0
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
    adminOnly,
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('content').notEmpty().withMessage('Content is required'),
        body('sport_id').notEmpty().withMessage('Sport ID is required'),
        body('source_url').optional(),
        body('image_url').optional(),
        body('published_date').optional(),
        body('status').isInt({ min: 0, max: 1 }).optional()
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
 *               source_url:
 *                 type: string
 *               image_url:
 *                 type: string
 *               published_date:
 *                 type: string
 *                 format: date-time
 *               sport_id:
 *                 type: string
 *               status:
 *                 type: integer
 *                 description: 0=devre dışı, 1=aktif
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
    adminOnly,
    [
        body('title').optional(),
        body('content').optional(),
        body('source_url').optional(),
        body('image_url').optional(),
        body('published_date').optional(),
        body('sport_id').optional(),
        body('status').isInt({ min: 0, max: 1 }).optional(),
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
router.delete('/:id', protect, adminOnly, newsController.deleteNews);

/**
 * @swagger
 * /api/news/search:
 *   get:
 *     tags:
 *       - News
 *     summary: Search news articles
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid search parameters
 */
router.get('/search', newsController.searchNews);

/**
 * @swagger
 * /api/news/recent:
 *   get:
 *     tags:
 *       - News
 *     summary: Get recent news articles
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of articles to return
 *       - in: query
 *         name: sport_id
 *         schema:
 *           type: string
 *         description: Filter by sport ID
 *     responses:
 *       200:
 *         description: List of recent news articles
 */
router.get('/recent', newsController.getRecentNews);

/**
 * @swagger
 * /api/news/active:
 *   get:
 *     tags:
 *       - News
 *     summary: Get active news articles (status=1)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Results per page
 *       - in: query
 *         name: sport_id
 *         schema:
 *           type: string
 *         description: Filter by sport ID
 *     responses:
 *       200:
 *         description: List of active news articles
 */
router.get('/active', newsController.getActiveNews);

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
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Results per page
 *       - in: query
 *         name: sport_id
 *         schema:
 *           type: string
 *         description: Filter by sport ID
 *     responses:
 *       200:
 *         description: List of news articles
 */
router.get('/', newsController.getNewsList);

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

export default router; 
import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { protectAdmin, authorize, isSuperAdmin } from '../middleware/adminAuthMiddleware';

const router = Router();
const adminController = new AdminController();

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Admin login
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
 *                 description: E-mail adresi veya kullanıcı adı
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Invalid credentials
 */
router.post(
    '/login',
    [
        body(['username', 'password']).optional(),
        body().custom(body => {
            // En az username veya email'den biri olmalı
            if (!body.username && !body.password) {
                throw new Error('Username or password is required');
            }
            return true;
        }),
        body('password').notEmpty().withMessage('Password is required'),
        validateRequest
    ],
    adminController.login.bind(adminController)
);

/**
 * @swagger
 * /api/admin/init-superadmin:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Initialize the first superadmin account (only works if no superadmin exists)
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
 *     responses:
 *       201:
 *         description: Superadmin created successfully
 *       400:
 *         description: A superadmin already exists
 */
router.post(
    '/init-superadmin',
    [
        body('email').isEmail().withMessage('Please enter a valid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        validateRequest
    ],
    adminController.createInitialSuperAdmin.bind(adminController)
);

/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Register a new admin user (Superadmin only)
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
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [admin, editor, moderator]
 *               isActive:
 *                 type: boolean
 *               profile:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   bio:
 *                     type: string
 *                   avatarUrl:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
    '/register',
    protectAdmin,
    isSuperAdmin,
    [
        body('email').isEmail().withMessage('Please enter a valid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['admin', 'editor', 'moderator', 'superadmin']).withMessage('Please enter a valid role'),
        body('profile.firstName').optional().notEmpty().withMessage('First name cannot be empty'),
        body('profile.lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
        validateRequest
    ],
    adminController.createAdmin.bind(adminController)
);

/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get admin profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', protectAdmin, adminController.getProfile.bind(adminController));

/**
 * @swagger
 * /api/admin/profile:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update admin profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put(
    '/profile',
    protectAdmin,
    [
        body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
        body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
        validateRequest
    ],
    adminController.updateProfile.bind(adminController)
);

/**
 * @swagger
 * /api/admin/list:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all admins (Admin and Superadmin only)
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: List of admins
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/list', protectAdmin, authorize(['superadmin', 'admin']), adminController.getAllAdmins.bind(adminController));

/**
 * @swagger
 * /api/admin/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get admin by ID (Admin and Superadmin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Admin retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 */
router.get('/:id', protectAdmin, authorize(['superadmin', 'admin']), adminController.getAdminById.bind(adminController));

/**
 * @swagger
 * /api/admin/{id}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update admin (Role changes Superadmin only, other fields Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
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
 *               role:
 *                 type: string
 *                 enum: [admin, editor, moderator, superadmin]
 *               isActive:
 *                 type: boolean
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 */
router.put(
    '/:id',
    protectAdmin,
    authorize(['superadmin']),
    [
        body('email').optional().isEmail().withMessage('Please enter a valid email address'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').optional().isIn(['admin', 'editor', 'moderator', 'superadmin']).withMessage('Please enter a valid role'),
        validateRequest
    ],
    adminController.updateAdmin.bind(adminController)
);

/**
 * @swagger
 * /api/admin/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete admin (Superadmin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 */
router.delete('/:id', protectAdmin, authorize(['superadmin']), adminController.deleteAdmin.bind(adminController));

/**
 * @swagger
 * /api/admin/dashboard-permissions:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get admin dashboard permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard permissions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard-permissions', protectAdmin, adminController.getDashboardPermissions.bind(adminController));

export default router; 
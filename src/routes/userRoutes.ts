import express from 'express';
import { UserController } from '../controllers/UserController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();
const userController = new UserController();

// All user routes are protected
router.use(protect);

// Routes accessible only to admins
router.get('/', restrictTo('admin'), userController.getAllUsers);

// Routes accessible to the user and admins
router.get('/:id', userController.getUserById);

export default router; 
import express from 'express';
import { ExampleController } from '../controllers/ExampleController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();
const exampleController = new ExampleController();

// Public routes
router.get('/examples', exampleController.listExamples);
router.get('/examples/:id', exampleController.getExampleById);

// Protected routes - require authentication
router.post('/examples', protect, exampleController.createExample);

export default router; 
import express from 'express';
import { EventController } from '../controllers/EventController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();
const eventController = new EventController();

// Public routes
router.get('/events', eventController.listEvents);
router.get('/events/upcoming', eventController.getUpcomingEvents);
router.get('/events/:id', eventController.getEventById);
router.get('/events/slug/:slug', eventController.getEventBySlug);

// Protected routes - require authentication
router.post('/events', protect, eventController.createEvent);
router.put('/events/:id', protect, eventController.updateEvent);
router.delete('/events/:id', protect, eventController.deleteEvent);
router.post('/events/:id/join', protect, eventController.joinEvent);
router.delete('/events/:id/leave', protect, eventController.leaveEvent);

export default router; 
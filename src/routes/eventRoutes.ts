import express from 'express';
import { EventController } from '../controllers/EventController';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();
const eventController = new EventController();

// Public routes
router.get('/', eventController.listEvents.bind(eventController));
router.get('/upcoming', eventController.getUpcomingEvents.bind(eventController));
router.get('/:id', eventController.getEventById.bind(eventController));
router.get('/slug/:slug', eventController.getEventBySlug.bind(eventController));

// Protected routes - require authentication
router.post('/', protect, eventController.createEvent.bind(eventController));
router.put('/:id', protect, eventController.updateEvent.bind(eventController));
router.delete('/:id', protect, eventController.deleteEvent.bind(eventController));
router.post('/:id/join', protect, eventController.joinEvent.bind(eventController));
router.delete('/:id/leave', protect, eventController.leaveEvent.bind(eventController));

// Admin routes - require admin role
router.get('/admin/pending', protect, isAdmin, eventController.getPendingEvents.bind(eventController));
router.post('/admin/:id/approve', protect, isAdmin, eventController.approveEvent.bind(eventController));
router.post('/admin/:id/reject', protect, isAdmin, eventController.rejectEvent.bind(eventController));
router.post('/admin/update-expired', protect, isAdmin, eventController.updateExpiredPendingEvents.bind(eventController));

export default router; 
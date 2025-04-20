import express from 'express';
import { EventController } from '../controllers/EventController';
import { protect, restrictTo } from '../middleware/authMiddleware';

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
router.get('/user/:userId', protect, eventController.getUserEvents.bind(eventController));
router.get('/my/events', protect, eventController.getUserEvents.bind(eventController));
router.get('/user/:userId/created', protect, eventController.getUserCreatedEvents.bind(eventController));
router.get('/my/created', protect, eventController.getUserCreatedEvents.bind(eventController));

// Admin routes - require admin or superadmin role
router.get('/admin/pending', protect, restrictTo('admin', 'superadmin'), eventController.getPendingEvents.bind(eventController));
router.post('/admin/:id/approve', protect, restrictTo('admin', 'superadmin'), eventController.approveEvent.bind(eventController));
router.post('/admin/:id/reject', protect, restrictTo('admin', 'superadmin'), eventController.rejectEvent.bind(eventController));
router.post('/admin/update-expired', protect, restrictTo('admin', 'superadmin'), eventController.updateExpiredPendingEvents.bind(eventController));

export default router; 
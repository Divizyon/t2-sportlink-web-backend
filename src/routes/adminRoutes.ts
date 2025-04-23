import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middlewares/authMiddleware';
import { adminOnly } from '../middlewares/adminMiddleware';

const router = Router();

// Bütün admin rotaları için authentication ve admin kontrolü
router.use(authenticate, adminOnly);

// Onay bekleyen etkinlikleri listele
router.get('/events/pending', AdminController.getPendingEvents);

// Etkinlik onaylama/reddetme
router.put('/events/:eventId/approve-reject', AdminController.approveOrRejectEvent);

// Filtreli etkinlik listesi (admin paneli için)
router.get('/events/filter', AdminController.getFilteredEvents);

export default router; 
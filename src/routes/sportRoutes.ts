import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware';
import { SportController } from '../controllers/SportController';

const router = Router();
const sportController = new SportController();

// Tüm sporları getirme - herkes erişebilir
router.get('/', sportController.getAllSports.bind(sportController));

// Spor detayını ID ile getirme - herkes erişebilir
router.get('/:id', sportController.getSportById.bind(sportController));

// Yeni spor ekleme - sadece admin erişebilir
router.post('/', protect, adminOnly, sportController.createSport.bind(sportController));

// Spor güncelleme - sadece admin erişebilir
router.put('/:id', protect, adminOnly, sportController.updateSport.bind(sportController));

// Spor silme - sadece admin erişebilir
router.delete('/:id', protect, adminOnly, sportController.deleteSport.bind(sportController));

export default router; 
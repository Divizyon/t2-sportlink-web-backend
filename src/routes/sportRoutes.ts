import express from 'express';
import { SportController } from '../controllers/SportController';
import { authenticate, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();
const sportController = new SportController();

// GET - Tüm sporları getir (herkes erişebilir)
router.get('/', sportController.getAllSports.bind(sportController));

// GET - ID'ye göre spor getir (herkes erişebilir)
router.get('/:id', sportController.getSportById.bind(sportController));

// POST - Yeni spor oluştur (sadece admin yetkisi gerekli)
router.post('/', authenticate, adminOnly, sportController.createSport.bind(sportController));

// PUT - Spor güncelle (sadece admin yetkisi gerekli)
router.put('/:id', authenticate, adminOnly, sportController.updateSport.bind(sportController));

// DELETE - Spor sil (sadece admin yetkisi gerekli)
router.delete('/:id', authenticate, adminOnly, sportController.deleteSport.bind(sportController));

export default router; 
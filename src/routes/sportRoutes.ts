import express from 'express';
import { SportController } from '../controllers/SportController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();
const sportController = new SportController();

// GET - Tüm sporları getir
router.get('/', sportController.getAllSports.bind(sportController));

// GET - ID'ye göre spor getir
router.get('/:id', sportController.getSportById.bind(sportController));

// POST - Yeni spor oluştur (admin yetkisi gerekli)
router.post('/', authenticate, sportController.createSport.bind(sportController));

// PUT - Spor güncelle (admin yetkisi gerekli)
router.put('/:id', authenticate, sportController.updateSport.bind(sportController));

// DELETE - Spor sil (admin yetkisi gerekli)
router.delete('/:id', authenticate, sportController.deleteSport.bind(sportController));

export default router; 
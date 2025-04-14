import express from 'express';
import { AdminController } from '../controllers/AdminController';
import { superadminMiddleware } from '../middleware/superadminMiddleware';

const router = express.Router();

// Admin registration (only superadmin can create new admins)
router.post('/register', superadminMiddleware, AdminController.register);

// Admin login
router.post('/login', AdminController.loginAdmin);

// Get all admins (only superadmin can view all admins)
router.get('/', superadminMiddleware, AdminController.getAllAdmins);

// Update admin (only superadmin can update other admins)
router.put('/:id', superadminMiddleware, AdminController.updateAdmin);

// Delete admin (only superadmin can delete admins)
router.delete('/:id', superadminMiddleware, AdminController.deleteAdmin);

export default router; 
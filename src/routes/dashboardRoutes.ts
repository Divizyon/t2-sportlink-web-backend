import express from 'express';
import { getDashboardStats, getSportPopularity, getSportEventsByDateRange, getLatestItems, getAllDashboardData } from '../controllers/dashboardController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard overview statistics
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, getDashboardStats);

/**
 * @route   GET /api/dashboard/sports-popularity
 * @desc    Get sport popularity statistics
 * @access  Private (Admin)
 */
router.get('/sports-popularity', authenticate, getSportPopularity);

/**
 * @route   GET /api/dashboard/sports-by-date
 * @desc    Get sport events by date range
 * @access  Private (Admin)
 */
router.get('/sports-by-date', authenticate, getSportEventsByDateRange);

/**
 * @route   GET /api/dashboard/latest-items
 * @desc    Get latest events, news, and announcements
 * @access  Private (Admin)
 */
router.get('/latest-items', authenticate, getLatestItems);

/**
 * @route   GET /api/dashboard/all-data
 * @desc    Get all dashboard data in one call
 * @access  Private (Admin)
 */
router.get('/all-data', authenticate, getAllDashboardData);

export default router; 
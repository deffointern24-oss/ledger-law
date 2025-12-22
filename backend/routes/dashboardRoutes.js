const express = require('express');
const {
  getDashboardStats,
  getRevenueStats,
  getOrdersAnalytics,
  getUsersAnalytics,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes require admin authorization
router.get('/stats', protect, authorize('admin'), getDashboardStats);
router.get('/revenue', protect, authorize('admin'), getRevenueStats);
router.get('/orders-analytics', protect, authorize('admin'), getOrdersAnalytics);
router.get('/users-analytics', protect, authorize('admin'), getUsersAnalytics);

module.exports = router;

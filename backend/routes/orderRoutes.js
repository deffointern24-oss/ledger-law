const express = require('express');
const {
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/my-orders', protect, getUserOrders);
router.get('/all', protect, authorize('admin'), getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;

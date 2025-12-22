const express = require('express');
const {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/all', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;

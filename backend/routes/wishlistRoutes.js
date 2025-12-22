const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlistItem,
  getWishlistCount,
  moveToCart
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All wishlist routes require authentication
router.get('/', protect, getWishlist);
router.get('/count', protect, getWishlistCount);
router.get('/check/:serviceId', protect, checkWishlistItem);
router.post('/add', protect, addToWishlist);
router.post('/move-to-cart', protect, moveToCart);
router.delete('/clear', protect, clearWishlist);
router.delete('/:serviceId', protect, removeFromWishlist);

module.exports = router;

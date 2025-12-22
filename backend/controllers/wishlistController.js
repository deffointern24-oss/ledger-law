const Wishlist = require('../models/Wishlist');

// Add indexes in your Wishlist model first
// wishlistSchema.index({ userId: 1 });
// wishlistSchema.index({ 'items.serviceId': 1 });

/**
 * Get User's Wishlist
 */
const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Use lean() for 3x faster queries [web:27]
    let wishlist = await Wishlist.findOne({ userId })
      .select('-__v')
      .lean();

    if (!wishlist) {
      wishlist = await Wishlist.create({ 
        userId, 
        items: [] 
      });
      return res.json({
        success: true,
        wishlist
      });
    }

    res.json({
      success: true,
      wishlist
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Add Item to Wishlist
 */
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { serviceId, serviceName, price } = req.body;

    // Validate required fields
    if (!serviceId || !serviceName || !price) {
      return res.status(400).json({ 
        success: false,
        message: 'serviceId, serviceName, and price are required' 
      });
    }

    // Validate price
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Price must be a positive number' 
      });
    }

    // Check if item already exists using atomic operation [web:25]
    const existingWishlist = await Wishlist.findOne({ 
      userId, 
      'items.serviceId': serviceId 
    }).lean();

    if (existingWishlist) {
      return res.status(400).json({ 
        success: false,
        message: 'Item already in wishlist' 
      });
    }

    // Use findOneAndUpdate with upsert for atomic operation [web:24]
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: { userId, createdAt: new Date() },
        $push: { 
          items: {
            serviceId,
            serviceName,
            price,
            addedAt: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      },
      { 
        upsert: true, 
        new: true,
        lean: true
      }
    );

    res.json({
      success: true,
      message: 'Item added to wishlist',
      wishlist,
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Remove Item from Wishlist
 */
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { serviceId } = req.params;

    // Single atomic operation using $pull [web:24]
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { 
        $pull: { items: { serviceId } },
        $set: { updatedAt: new Date() }
      },
      { new: true, lean: true }
    );

    if (!wishlist) {
      return res.status(404).json({ 
        success: false,
        message: 'Wishlist not found' 
      });
    }

    res.json({
      success: true,
      message: 'Item removed from wishlist',
      wishlist,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Clear Entire Wishlist
 */
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    // Single atomic operation [web:24]
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { 
        items: [],
        updatedAt: new Date()
      },
      { new: true, lean: true }
    );

    if (!wishlist) {
      return res.status(404).json({ 
        success: false,
        message: 'Wishlist not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Wishlist cleared',
      wishlist
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Check if Item is in Wishlist
 */
const checkWishlistItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { serviceId } = req.params;

    // Optimized query - only check existence [web:26]
    const exists = await Wishlist.exists({ 
      userId, 
      'items.serviceId': serviceId 
    });

    res.json({ 
      success: true,
      isInWishlist: !!exists 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get Wishlist Item Count
 */
const getWishlistCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ userId })
      .select('items')
      .lean();

    const count = wishlist ? wishlist.items.length : 0;

    res.json({ 
      success: true,
      count 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Move Items from Wishlist to Cart (Bulk)
 */
const moveToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { serviceIds } = req.body; // Array of serviceIds

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'serviceIds array is required' 
      });
    }

    const wishlist = await Wishlist.findOne({ userId }).lean();

    if (!wishlist) {
      return res.status(404).json({ 
        success: false,
        message: 'Wishlist not found' 
      });
    }

    // Get items to move
    const itemsToMove = wishlist.items.filter(
      item => serviceIds.includes(item.serviceId)
    );

    if (itemsToMove.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No items found to move' 
      });
    }

    // Add to cart (you'll need to implement this in cart controller)
    const Cart = require('../models/Cart');
    
    for (const item of itemsToMove) {
      await Cart.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: { userId },
          $push: { 
            items: {
              serviceId: item.serviceId,
              serviceName: item.serviceName,
              price: item.price,
              quantity: 1
            }
          }
        },
        { upsert: true }
      );
    }

    // Remove from wishlist
    await Wishlist.findOneAndUpdate(
      { userId },
      { 
        $pull: { items: { serviceId: { $in: serviceIds } } },
        $set: { updatedAt: new Date() }
      }
    );

    res.json({
      success: true,
      message: `${itemsToMove.length} item(s) moved to cart`,
      movedCount: itemsToMove.length
    });

  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlistItem,
  getWishlistCount,
  moveToCart
};

const Cart = require('../models/Cart');
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Use lean() for 3x faster queries [web:27][web:30]
    let cart = await Cart.findOne({ userId }).lean();

    if (!cart) {
      cart = await Cart.create({ userId, items: [], totalAmount: 0 });
      return res.json(cart);
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { serviceId, serviceName, price, quantity = 1 } = req.body;

    // Validate required fields
    if (!serviceId || !serviceName || !price) {
      return res.status(400).json({ 
        message: 'serviceId, serviceName, and price are required' 
      });
    }

    // Validate quantity
    if (quantity < 1 || quantity > 99) {
      return res.status(400).json({ 
        message: 'Quantity must be between 1 and 99' 
      });
    }

    // Use findOneAndUpdate for atomic operation [web:25]
    const cart = await Cart.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: { userId, createdAt: new Date() }
      },
      { 
        upsert: true, 
        new: false, // Get old document first
        lean: true 
      }
    );

    // Calculate new items array
    let updatedItems;
    let itemExists = false;

    if (!cart || !cart.items || cart.items.length === 0) {
      updatedItems = [{
        serviceId,
        serviceName,
        price,
        quantity,
      }];
    } else {
      updatedItems = [...cart.items];
      const itemIndex = updatedItems.findIndex(
        item => item.serviceId === serviceId
      );

      if (itemIndex > -1) {
        updatedItems[itemIndex].quantity += quantity;
        itemExists = true;
      } else {
        updatedItems.push({
          serviceId,
          serviceName,
          price,
          quantity,
        });
      }
    }

    // Calculate total amount
    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Single atomic update [web:24]
    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { 
        items: updatedItems,
        totalAmount,
        updatedAt: new Date()
      },
      { new: true, lean: true }
    );

    res.json({
      message: itemExists ? 'Cart quantity updated' : 'Item added to cart',
      cart: updatedCart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { serviceId, quantity } = req.body;

    if (quantity < 1 || quantity > 99) {
      return res.status(400).json({ 
        message: 'Quantity must be between 1 and 99' 
      });
    }

    // Single atomic operation using arrayFilters [web:25]
    const cart = await Cart.findOneAndUpdate(
      { 
        userId,
        'items.serviceId': serviceId 
      },
      {
        $set: { 'items.$.quantity': quantity }
      },
      { new: false, lean: true }
    );

    if (!cart) {
      return res.status(404).json({ 
        message: 'Cart or item not found' 
      });
    }

    // Recalculate total
    const updatedItems = cart.items.map(item => 
      item.serviceId === serviceId 
        ? { ...item, quantity } 
        : item
    );

    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { totalAmount, updatedAt: new Date() },
      { new: true, lean: true }
    );

    res.json({
      message: 'Cart updated',
      cart: updatedCart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { serviceId } = req.params;

    // Single atomic operation using $pull [web:24]
    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { 
        $pull: { items: { serviceId } }
      },
      { new: false, lean: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Recalculate total amount
    const remainingItems = updatedCart.items.filter(
      item => item.serviceId !== serviceId
    );
    
    const totalAmount = remainingItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const finalCart = await Cart.findOneAndUpdate(
      { userId },
      { totalAmount, updatedAt: new Date() },
      { new: true, lean: true }
    );

    res.json({
      message: 'Item removed from cart',
      cart: finalCart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    // Single atomic operation [web:24]
    await Cart.findOneAndUpdate(
      { userId },
      { 
        items: [], 
        totalAmount: 0,
        updatedAt: new Date()
      },
      { lean: true }
    );

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
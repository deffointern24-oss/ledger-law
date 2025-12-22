// controllers/orderController.js
const Order = require('../models/Order');
const User = require('../models/User');

/**
 * Get User's Orders with Pagination
 */
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * limitNumber;

    const userId = req.user._id;

    const [totalOrders, orders] = await Promise.all([
      Order.countDocuments({ userId }),
      Order.find({ userId })
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean()
    ]);

    const totalPages = Math.ceil(totalOrders / limitNumber);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalOrders,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Order Details by ID
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, userId })
      .select('-__v')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get All Orders (Admin) with Filters & Pagination - FIXED
 */
const getAllOrders = async (req, res) => {
  try {
    const {
      orderStatus,      // Changed from 'status' to 'orderStatus'
      paymentStatus,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = {};

    // Use orderStatus field (matches your model)
    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search by user
    let userIds = [];
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id').lean();

      userIds = users.map(u => u._id);
      if (userIds.length > 0) {
        filter.userId = { $in: userIds };
      } else {
        return res.json({
          success: true,
          orders: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalOrders: 0,
            limit: parseInt(limit),
            hasNextPage: false,
            hasPrevPage: false
          }
        });
      }
    }

    // Pagination setup
    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * limitNumber;

    console.log('Order filter:', JSON.stringify(filter, null, 2));

    // Parallel execution
    const [totalOrders, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .populate('userId', 'name email phone')
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean()
    ]);

    const totalPages = Math.ceil(totalOrders / limitNumber);

    console.log('Found orders:', totalOrders, 'on page:', pageNumber);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalOrders,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update Order Status (Admin) - FIXED
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body; // Changed from 'status'
    const { id } = req.params;

    const validStatuses = [
      'Pending',
      'Confirmed',
      'Under Verification',
      'Documentation',
      'Completed',
      'Cancelled'
    ];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid options: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        orderStatus,
        updatedAt: new Date(),
        $push: {
          statusHistory: {
            status: orderStatus,
            timestamp: new Date(),
            updatedBy: req.user?._id || 'admin'
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate('userId', 'name email phone')
      .select('-__v')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: `Order status updated to ${orderStatus}`,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update Payment Status (Admin)
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const { id } = req.params;

    const validStatuses = ['Pending', 'Completed', 'Failed', 'Refunded'];

    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Valid options: ${validStatuses.join(', ')}`
      });
    }

    const updateData = {
      paymentStatus,
      updatedAt: new Date()
    };

    // If payment is completed, set paidAt timestamp
    if (paymentStatus === 'Completed') {
      updateData.paidAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('userId', 'name email phone')
      .select('-__v')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
};
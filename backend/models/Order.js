const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: 'Professional service registration'
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  rate: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true, 
    default: () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },
  
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Customer Information Snapshot (from user at time of order)
  customerInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    businessName: {
      type: String,
      default: ''
    },
    gstin: {
      type: String,
      default: ''
    }
  },

  // Order Items
  items: [orderItemSchema],

  // Pricing Breakdown
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    gstRate: {
      type: Number,
      default: 18
    },
    gstAmount: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    shipping: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },

  // Payment Details
  paymentMethod: {
    type: String,
    enum: ['ONLINE', 'COD', 'UPI', 'CARD', 'NETBANKING'],
    default: 'ONLINE'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  paidAt: {
    type: Date
  },

  // Order Status
  orderStatus: {
    type: String,
    enum: ['Confirmed', 'Pending', 'Under Verification', 'Documentation', 'Completed', 'Cancelled'],
    default: 'Pending'
  },

  // Estimate Delivery Date
  estimateDate: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },

  // Status History Tracking
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String
    },
    updatedBy: {
      type: String
    }
  }],

  // Invoice Details (for future use)
  invoiceNumber: {
    type: String
  },
  invoiceUrl: {
    type: String
  }

}, {
  timestamps: true
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, paymentStatus: 1 });

// Virtual for formatted total
orderSchema.virtual('formattedTotal').get(function() {
  return `₹${this.pricing.total.toLocaleString('en-IN')}`;
});

// Virtual for formatted subtotal
orderSchema.virtual('formattedSubtotal').get(function() {
  return `₹${this.pricing.subtotal.toLocaleString('en-IN')}`;
});

// Virtual for formatted GST
orderSchema.virtual('formattedGST').get(function() {
  return `₹${this.pricing.gstAmount.toLocaleString('en-IN')}`;
});

module.exports = mongoose.model('Order', orderSchema);

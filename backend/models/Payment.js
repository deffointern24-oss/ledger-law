const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },

  // Razorpay Payment Gateway Details
  razorpay_order_id: {
    type: String,
    required: true,
    unique: true 
  },
  razorpay_payment_id: {
    type: String
  },
  razorpay_signature: {
    type: String
  },

  // Amount Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },

  // Payment Status
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },

  // Payment Method (captured from Razorpay)
  method: {
    type: String,
    enum: ['card', 'netbanking', 'wallet', 'upi', 'other'],
    default: 'other'
  },

  // Services Snapshot (what was purchased)
  services: [{
    serviceId: {
      type: String,
      required: true
    },
    serviceName: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    }
  }],

  // Payment Timestamps
  paidAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },

  // Failure Details
  failureReason: {
    type: String
  },
  errorCode: {
    type: String
  },
  errorDescription: {
    type: String
  },

  // Refund Details
  refund: {
    refundId: String,
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed']
    }
  },

  // Additional Metadata
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }

}, {
  timestamps: true
});

paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString('en-IN')}`;
});

module.exports = mongoose.model('Payment', paymentSchema);

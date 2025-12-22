const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,  
    },
    items: [cartItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

cartSchema.index({ 'items.serviceId': 1 });

module.exports = mongoose.model('Cart', cartSchema);
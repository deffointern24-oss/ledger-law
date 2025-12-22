// routes/paymentRoutes.js
const express = require("express");
const { createOrder, paymentVerification} = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();
router.post("/create-order", protect, authorize('customer'), createOrder);
router.post("/payment-verification", protect, paymentVerification);

module.exports = router;

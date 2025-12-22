const instance = require("../config/razorpay.js");
const Order = require("../models/Order");
const User = require("../models/User");
const Payment = require("../models/Payment");
const Cart = require("../models/Cart");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Create Order for Services (GST Filing, ITR, etc.)
 */
const createOrder = async (req, res) => {
    try {
        console.log("🚀 Creating order with data:", req.body);
        const { items } = req.body;

        const userId = req.user._id;

        // Validate input
        if (!userId || !items?.length) {
            return res.status(400).json({
                error: "Invalid order data. Items are required."
            });
        }

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        console.log('Creating order for user:', {
            name: user.name,
            email: user.email,
            phone: user.phone // ← Check this value
        });
        // Prepare order items with proper structure
        const orderItems = items.map(item => {
            if (!item.serviceId || !item.serviceName || !item.price || !item.quantity) {
                throw new Error(`Invalid item data for service: ${item.serviceName || 'Unknown'}`);
            }

            const amount = item.price * item.quantity;

            return {
                serviceId: item.serviceId,
                serviceName: item.serviceName,
                description: item.description || 'Professional service registration',
                quantity: item.quantity,
                rate: item.price,
                amount: amount
            };
        });

        // Calculate subtotal
        const subtotal = orderItems.reduce((sum, item) => sum + item.amount, 0);

        // Calculate GST (18% for services in India)
        const gstRate = 18;
        const gstAmount = Math.round(subtotal * (gstRate / 100));

        // Total amount (subtotal + GST)
        const total = subtotal + gstAmount;

        console.log('💰 Financial Breakdown:', {
            subtotal,
            gstRate: `${gstRate}%`,
            gstAmount,
            total
        });

        // Calculate estimate date (7 days from now)
        const estimateDate = new Date();
        estimateDate.setDate(estimateDate.getDate() + 7);

        // Create Razorpay order
        const razorpayOrder = await instance.orders.create({
            amount: Math.round(total * 100), // Amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: userId.toString(),
                userName: user.name,
                userEmail: user.email,
                itemCount: items.length
            }
        });

        console.log('✅ Razorpay order created:', razorpayOrder.id);

        // Create Order Document
        const order = await Order.create({
            userId,

            // Customer Info Snapshot (from your screenshot)
            customerInfo: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                businessName: user.business_name || '',
                gstin: user.gstin || ''
            },

            // Order Items
            items: orderItems,

            // Pricing Breakdown
            pricing: {
                subtotal: subtotal,
                gstRate: gstRate,
                gstAmount: gstAmount,
                discount: 0,
                shipping: 0,
                total: total
            },

            // Payment Info
            paymentMethod: "ONLINE",
            paymentStatus: "Pending",
            razorpayOrderId: razorpayOrder.id,

            // Order Status
            orderStatus: "Pending",
            estimateDate: estimateDate,

            // Status History
            statusHistory: [{
                status: 'Pending',
                timestamp: new Date(),
                note: 'Order created'
            }]
        });

        console.log('✅ Order created in DB:', order._id);
        console.log('📋 Order Number:', order.orderNumber);

        // Create Payment Record
        await Payment.create({
            userId,
            orderId: order._id,

            // Razorpay Details
            razorpay_order_id: razorpayOrder.id,

            // Amount
            amount: total,
            currency: 'INR',

            // Services Snapshot
            services: orderItems.map(item => ({
                serviceId: item.serviceId,
                serviceName: item.serviceName,
                price: item.rate,
                quantity: item.quantity
            })),

            // Status
            status: "PENDING"
        });

        console.log('✅ Payment record created');

        // Clear user's cart after order creation
        try {
            await Cart.findOneAndUpdate(
                { userId },
                { items: [], totalAmount: 0 }
            );
            console.log('✅ Cart cleared');
        } catch (cartError) {
            console.error('⚠️ Failed to clear cart:', cartError.message);
        }

        // Return response
        return res.status(201).json({
            success: true,
            razorpayOrder: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            },
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                total: order.pricing.total,
                subtotal: order.pricing.subtotal,
                gstAmount: order.pricing.gstAmount,
                items: order.items,
                estimateDate: order.estimateDate,
                customerInfo: order.customerInfo
            },
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("❌ Order creation error:", error);
        return res.status(500).json({
            error: "Failed to create order",
            message: error.message
        });
    }
};

/**
 * Verify Razorpay Payment Signature
 */
const paymentVerification = async (req, res) => {
    try {
        console.log("🔐 Verifying payment:", req.body);

        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        } = req.body;

        // Validate required fields
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({
                error: "Missing payment verification data"
            });
        }

        // Create signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest("hex");

        console.log("Expected signature:", expectedSign);
        console.log("Received signature:", razorpay_signature);

        // Verify signature
        if (expectedSign !== razorpay_signature) {
            console.error("❌ Invalid signature");

            await Payment.findOneAndUpdate(
                { razorpay_order_id },
                {
                    status: "FAILED",
                    razorpay_payment_id,
                    razorpay_signature,
                    failureReason: "Invalid signature",
                    failedAt: new Date()
                }
            );

            return res.status(400).json({
                success: false,
                error: "Invalid payment signature"
            });
        }

        console.log("✅ Signature verified");

        // Update payment record
        const paymentInfo = await Payment.findOneAndUpdate(
            { razorpay_order_id },
            {
                razorpay_payment_id,
                razorpay_signature,
                status: "SUCCESS",
                paidAt: new Date()
            },
            { new: true }
        );

        if (!paymentInfo) {
            return res.status(404).json({
                error: "Payment record not found"
            });
        }

        console.log("✅ Payment updated:", paymentInfo._id);

        // Update order status
        const order = await Order.findByIdAndUpdate(
            paymentInfo.orderId,
            {
                paymentStatus: "Completed",
                orderStatus: "Confirmed",
                paidAt: new Date(),
                razorpayPaymentId: razorpay_payment_id,
                $push: {
                    statusHistory: {
                        status: 'Confirmed',
                        timestamp: new Date(),
                        note: 'Payment verified and order confirmed'
                    }
                }
            },
            { new: true }
        );

        console.log("✅ Order confirmed:", order._id);

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            orderId: paymentInfo.orderId,
            orderNumber: order.orderNumber,
            paymentId: razorpay_payment_id,
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                total: order.pricing.total,
                status: order.orderStatus,
                estimateDate: order.estimateDate
            }
        });

    } catch (error) {
        console.error("❌ Payment verification error:", error);
        return res.status(500).json({
            success: false,
            error: "Payment verification failed",
            message: error.message
        });
    }
};


module.exports = {
    createOrder,
    paymentVerification
};

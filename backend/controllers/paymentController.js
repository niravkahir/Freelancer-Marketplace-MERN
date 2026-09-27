const crypto = require('crypto');
const Payment = require('../models/Payment');
const FreelancerProfile = require('../models/FreelancerProfile');
const Conversation = require('../models/Conversation');
const Project = require('../models/Project');
const Contract = require('../models/Contract');
const Notification = require('../models/Notification');
const razorpay = require('../config/razorpay');

// @desc    Create payment (record — no Razorpay yet)
// @route   POST /api/payments
// @access  Private (Client)
exports.createPayment = async (req, res) => {
    try {
        const { projectId, proposalId, amount, paymentMethod, freelancerId } = req.body;
        if (!projectId || !proposalId || !amount || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        const payment = await Payment.create({
            projectId,
            proposalId,
            clientId: req.user.id,
            freelancerId: freelancerId || req.user.id,
            amount,
            paymentMethod,
            status: 'PENDING'
        });
        res.status(201).json({
            success: true,
            message: 'Payment created successfully',
            payment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get my payments
// @route   GET /api/payments
// @access  Private
exports.getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.find({
            $or: [
                { clientId: req.user.id },
                { freelancerId: req.user.id }
            ]
        })
            .populate('projectId', 'title')
            .populate('proposalId', 'coverLetter')
            .populate('clientId', 'name email')
            .populate('freelancerId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: payments.length,
            payments
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private (participant)
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('projectId', 'title description')
            .populate('proposalId', 'coverLetter bidAmount')
            .populate('clientId', 'name email')
            .populate('freelancerId', 'name email');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        const isParticipant =
            payment.clientId._id.toString() === req.user.id ||
            payment.freelancerId._id.toString() === req.user.id ||
            req.user.role === 'ADMIN';

        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.status(200).json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private (Client only)
exports.createRazorpayOrder = async (req, res) => {
    try {
        const { paymentId } = req.body;

        if (!paymentId) {
            return res.status(400).json({ success: false, message: 'paymentId is required' });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (payment.clientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the client can pay' });
        }

        if (payment.status === 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Already paid' });
        }

        // Create Razorpay order
        const options = {
            amount: Math.round(payment.amount * 100), // Razorpay uses paise
            currency: 'INR',
            receipt: `receipt_payment_${payment._id}`,
            notes: {
                paymentId: payment._id.toString(),
                projectId: payment.projectId.toString(),
            }
        };

        const order = await razorpay.orders.create(options);

        // Save Razorpay order ID
        payment.transactionId = order.id;
        payment.status = 'PROCESSING';
        await payment.save();

        res.status(200).json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
            },
            key: process.env.RAZORPAY_KEY_ID,
            paymentId: payment._id,
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Razorpay signature + mark payment completed
// @route   POST /api/payments/verify
// @access  Private (Client only)
exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentId) {
            return res.status(400).json({ success: false, message: 'Missing verification data' });
        }

        // ✅ Verify HMAC signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid signature. Payment not verified.'
            });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (payment.status === 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Already completed' });
        }

        // ✅ Mark payment completed
        payment.status = 'COMPLETED';
        payment.transactionId = razorpay_payment_id;
        payment.completionDate = new Date();
        await payment.save();

        // ✅ Update freelancer earnings
        await FreelancerProfile.findOneAndUpdate(
            { userId: payment.freelancerId },
            { $inc: { totalEarnings: payment.amount } }
        );

        // ✅ Notify freelancer
        try {
            await Notification.create({
                userId: payment.freelancerId,
                type: 'PAYMENT_RECEIVED',
                title: 'Payment Received 💰',
                message: `You received ₹${payment.amount.toLocaleString()} from the client`,
                link: `/payments/${payment._id}`,
                relatedEntity: { entityType: 'PAYMENT', entityId: payment._id }
            });

            if (req.io) {
                req.io.to(payment.freelancerId.toString()).emit('newNotification');
                req.io.to(payment.freelancerId.toString()).emit('paymentChanged', {
                    paymentId: payment._id
                });
                req.io.to(payment.clientId.toString()).emit('paymentChanged', {
                    paymentId: payment._id
                });
            }
        } catch (e) { console.error('Notification error:', e); }

        // ✅ If project is Completed → lock chat
        const project = await Project.findById(payment.projectId);
        if (project && project.status === 'Completed') {
            project.chatLocked = true;
            await project.save();

            await Conversation.findOneAndUpdate(
                { relatedProject: project._id },
                {
                    isLocked: true,
                    lockedBy: req.user.id,
                    lockedAt: new Date(),
                    lockReason: 'PROJECT_COMPLETED'
                }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified and completed',
            payment
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update payment status manually (fallback / admin)
// @route   PUT /api/payments/:id/status
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { status, transactionId } = req.body;
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        const wasCompleted = payment.status === 'COMPLETED';

        payment.status = status || payment.status;
        if (transactionId) payment.transactionId = transactionId;
        if (status === 'COMPLETED' && !wasCompleted) {
            payment.completionDate = new Date();
        }

        await payment.save();

        if (status === 'COMPLETED' && !wasCompleted) {
            await FreelancerProfile.findOneAndUpdate(
                { userId: payment.freelancerId },
                { $inc: { totalEarnings: payment.amount } }
            );

            try {
                await Notification.create({
                    userId: payment.freelancerId,
                    type: 'PAYMENT_RECEIVED',
                    title: 'Payment Received 💰',
                    message: `You received ₹${payment.amount.toLocaleString()}`,
                    link: `/payments`,
                    relatedEntity: { entityType: 'PAYMENT', entityId: payment._id }
                });

                if (req.io) {
                    req.io.to(payment.freelancerId.toString()).emit('newNotification');
                    req.io.to(payment.freelancerId.toString()).emit('paymentChanged', {
                        paymentId: payment._id
                    });
                }
            } catch (notifErr) {
                console.error('Notification error:', notifErr);
            }

            const project = await Project.findById(payment.projectId);
            if (project && project.status === 'Completed') {
                project.chatLocked = true;
                await project.save();

                await Conversation.findOneAndUpdate(
                    { relatedProject: project._id },
                    {
                        isLocked: true,
                        lockedBy: req.user.id,
                        lockedAt: new Date(),
                        lockReason: 'PROJECT_COMPLETED'
                    }
                );
            }
        }

        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            payment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
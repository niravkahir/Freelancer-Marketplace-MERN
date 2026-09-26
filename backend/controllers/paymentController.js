const Payment = require('../models/Payment');
const FreelancerProfile = require('../models/FreelancerProfile');
const Conversation = require('../models/Conversation');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

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

exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('projectId', 'title')
            .populate('proposalId', 'coverLetter')
            .populate('clientId', 'name email')
            .populate('freelancerId', 'name email');
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        res.status(200).json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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

            // ✅ Notify freelancer — payment received
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
                }
            } catch (notifErr) {
                console.error('Notification error:', notifErr);
            }

            // ✅ Check if project is also completed → lock chat
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
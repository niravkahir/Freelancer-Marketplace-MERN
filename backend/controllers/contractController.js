const Contract = require('../models/Contract');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const Notification = require('../models/Notification');

// @desc    Create contract (Client only, after proposal accepted)
// @route   POST /api/contracts
// @access  Private (Client)
exports.createContract = async (req, res) => {
    try {
        const { proposalId, title, description, budget, startDate, endDate, terms } = req.body;

        if (!proposalId || !title || !description || !budget || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const proposal = await Proposal.findById(proposalId);
        if (!proposal) {
            return res.status(404).json({ success: false, message: 'Proposal not found' });
        }

        if (proposal.status !== 'Accepted') {
            return res.status(400).json({
                success: false,
                message: 'Can only create contracts from accepted proposals'
            });
        }

        const project = await Project.findById(proposal.projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (project.clientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const existing = await Contract.findOne({ proposalId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Contract already exists for this proposal',
                contractId: existing._id
            });
        }

        const contract = await Contract.create({
            projectId: project._id,
            proposalId: proposal._id,
            clientId: req.user.id,
            freelancerId: proposal.freelancerId,
            title,
            description,
            budget,
            startDate,
            endDate,
            terms: terms || '',
            status: 'PENDING'
        });

        // ✅ Notify freelancer + broadcast
        try {
            await Notification.create({
                userId: proposal.freelancerId,
                type: 'CONTRACT_CREATED',
                title: 'New Contract Received 📜',
                message: `A contract has been created for "${project.title}". Please review and sign.`,
                link: `/contracts/${contract._id}`,
                relatedEntity: { entityType: 'CONTRACT', entityId: contract._id }
            });

            if (req.io) {
                req.io.to(proposal.freelancerId.toString()).emit('newNotification');
                req.io.to(proposal.freelancerId.toString()).emit('contractChanged', {
                    contractId: contract._id
                });
            }
        } catch (e) { console.error('Notif error:', e); }

        res.status(201).json({
            success: true,
            message: 'Contract created successfully',
            contractId: contract._id,
            contract
        });
    } catch (error) {
        console.error('Create contract error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get my contracts (client or freelancer)
// @route   GET /api/contracts
// @access  Private
exports.getMyContracts = async (req, res) => {
    try {
        const contracts = await Contract.find({
            $or: [
                { clientId: req.user.id },
                { freelancerId: req.user.id }
            ]
        })
            .populate('projectId', 'title budget category')
            .populate('clientId', 'name email')
            .populate('freelancerId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: contracts.length,
            contracts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single contract
// @route   GET /api/contracts/:id
// @access  Private (participant)
exports.getContractById = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id)
            .populate('projectId', 'title description budget')
            .populate('proposalId', 'coverLetter bidAmount estimatedTime')
            .populate('clientId', 'name email phone')
            .populate('freelancerId', 'name email phone');

        if (!contract) {
            return res.status(404).json({ success: false, message: 'Contract not found' });
        }

        const isParticipant =
            contract.clientId._id.toString() === req.user.id ||
            contract.freelancerId._id.toString() === req.user.id ||
            req.user.role === 'ADMIN';

        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.status(200).json({ success: true, contract });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Sign contract
// @route   PUT /api/contracts/:id/sign
// @access  Private (participant)
exports.signContract = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);

        if (!contract) {
            return res.status(404).json({ success: false, message: 'Contract not found' });
        }

        const isClient = contract.clientId.toString() === req.user.id;
        const isFreelancer = contract.freelancerId.toString() === req.user.id;

        if (!isClient && !isFreelancer) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (contract.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Contract is already ${contract.status}`
            });
        }

        if (isClient) {
            if (contract.signedByClient) {
                return res.status(400).json({ success: false, message: 'Already signed' });
            }
            contract.signedByClient = true;
        } else {
            if (contract.signedByFreelancer) {
                return res.status(400).json({ success: false, message: 'Already signed' });
            }
            contract.signedByFreelancer = true;
        }

        if (contract.signedByClient && contract.signedByFreelancer) {
            contract.status = 'ACTIVE';
            contract.signedAt = new Date();
        }

        await contract.save();

        // ✅ Notify other party + broadcast
        const otherPartyId = isClient ? contract.freelancerId : contract.clientId;
        try {
            await Notification.create({
                userId: otherPartyId,
                type: 'CONTRACT_SIGNED',
                title: contract.status === 'ACTIVE' ? 'Contract Active! ✅' : 'Contract Signed',
                message: contract.status === 'ACTIVE'
                    ? 'Both parties signed. The contract is now active.'
                    : 'The other party signed the contract. Please review and sign.',
                link: `/contracts/${contract._id}`,
                relatedEntity: { entityType: 'CONTRACT', entityId: contract._id }
            });

            if (req.io) {
                req.io.to(otherPartyId.toString()).emit('newNotification');
                // ✅ Broadcast to both parties so their pages update live
                req.io.to(contract.clientId.toString()).emit('contractChanged', {
                    contractId: contract._id
                });
                req.io.to(contract.freelancerId.toString()).emit('contractChanged', {
                    contractId: contract._id
                });
            }
        } catch (e) { console.error('Notif error:', e); }

        res.status(200).json({
            success: true,
            message: contract.status === 'ACTIVE' ? 'Contract is now active' : 'Contract signed',
            contract
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark contract as completed (client only)
// @route   PUT /api/contracts/:id/complete
// @access  Private (Client)
exports.completeContract = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);

        if (!contract) {
            return res.status(404).json({ success: false, message: 'Contract not found' });
        }

        if (contract.clientId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (contract.status !== 'ACTIVE') {
            return res.status(400).json({
                success: false,
                message: 'Only active contracts can be completed'
            });
        }

        contract.status = 'COMPLETED';
        contract.completedAt = new Date();
        await contract.save();

        await Project.findByIdAndUpdate(contract.projectId, {
            status: 'Completed',
            completionDate: new Date()
        });

        try {
            await Notification.create({
                userId: contract.freelancerId,
                type: 'PROJECT_COMPLETED',
                title: 'Project Completed! ✅',
                message: 'The client marked the project as completed.',
                link: `/contracts/${contract._id}`,
                relatedEntity: { entityType: 'CONTRACT', entityId: contract._id }
            });

            if (req.io) {
                req.io.to(contract.freelancerId.toString()).emit('newNotification');
                req.io.to(contract.clientId.toString()).emit('contractChanged', {
                    contractId: contract._id
                });
                req.io.to(contract.freelancerId.toString()).emit('contractChanged', {
                    contractId: contract._id
                });
            }
        } catch (e) { console.error('Notif error:', e); }

        res.status(200).json({
            success: true,
            message: 'Contract completed',
            contract
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
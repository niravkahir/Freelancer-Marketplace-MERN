const Contract = require('../models/Contract');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');

exports.createContract = async (req, res) => {
    try {
        const { projectId, proposalId, title, description, budget, startDate, endDate, terms } = req.body;
        if (!projectId || !proposalId || !title || !budget || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const proposal = await Proposal.findById(proposalId);
        if (!proposal) {
            return res.status(404).json({ success: false, message: 'Proposal not found' });
        }
        const contract = await Contract.create({
            projectId,
            proposalId,
            clientId: req.user.id,
            freelancerId: proposal.freelancerId,
            title,
            description,
            budget,
            startDate,
            endDate,
            terms,
            status: 'PENDING'
        });
        res.status(201).json({
            success: true,
            message: 'Contract created successfully',
            contract
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMyContracts = async (req, res) => {
    try {
        const contracts = await Contract.find({
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
            count: contracts.length,
            contracts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getContractById = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id)
            .populate('projectId', 'title description')
            .populate('proposalId', 'coverLetter bidAmount')
            .populate('clientId', 'name email')
            .populate('freelancerId', 'name email');
        if (!contract) {
            return res.status(404).json({ success: false, message: 'Contract not found' });
        }
        res.status(200).json({ success: true, contract });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.signContract = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) {
            return res.status(404).json({ success: false, message: 'Contract not found' });
        }
        if (req.user.id === contract.clientId.toString()) {
            contract.signedByClient = true;
        } else if (req.user.id === contract.freelancerId.toString()) {
            contract.signedByFreelancer = true;
        } else {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to sign this contract'
            });
        }
        if (contract.signedByClient && contract.signedByFreelancer) {
            contract.status = 'ACTIVE';
            contract.signedAt = new Date();
        }
        await contract.save();
        res.status(200).json({
            success: true,
            message: 'Contract signed successfully',
            contract
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
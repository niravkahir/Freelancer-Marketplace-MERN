const Skill = require('../models/Skill');

exports.createSkill = async (req, res) => {
    try {
        const { name, category, description } = req.body;
        if (!name || !category) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name and category'
            });
        }
        const skill = await Skill.create({ name, category, description });
        res.status(201).json({
            success: true,
            message: 'Skill created successfully',
            skill
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Skill already exists'
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllSkills = async (req, res) => {
    try {
        const skills = await Skill.find({ isActive: true }).sort({ popularity: -1 });
        res.status(200).json({
            success: true,
            count: skills.length,
            skills
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSkillById = async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);
        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }
        res.status(200).json({ success: true, skill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.searchSkills = async (req, res) => {
    try {
        const { query, category } = req.query;
        const filter = { isActive: true };
        if (query) filter.name = { $regex: query, $options: 'i' };
        if (category) filter.category = category;
        const skills = await Skill.find(filter).sort({ popularity: -1 });
        res.status(200).json({
            success: true,
            count: skills.length,
            skills
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
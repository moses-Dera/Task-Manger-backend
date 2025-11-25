const TaskTemplate = require('../models/TaskTemplate');
const Task = require('../models/Task');
const { validationResult } = require('express-validator');

/**
 * Get all task templates for the company
 */
const getTemplates = async (req, res) => {
    try {
        const company = req.user.company;

        const templates = await TaskTemplate.find({ company, is_active: true })
            .populate('created_by', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: templates });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
};

/**
 * Create a new task template
 */
const createTemplate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        const template = new TaskTemplate({
            ...req.body,
            created_by: req.user._id,
            company: req.user.company
        });

        await template.save();
        await template.populate('created_by', 'name email');

        res.status(201).json({ success: true, data: template });
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ success: false, error: 'Failed to create template' });
    }
};

/**
 * Create a task from a template
 */
const createTaskFromTemplate = async (req, res) => {
    try {
        const { templateId, assigned_to, due_date } = req.body;

        const template = await TaskTemplate.findOne({
            _id: templateId,
            company: req.user.company,
            is_active: true
        });

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        // Create task from template
        const task = new Task({
            title: template.title,
            description: template.description,
            priority: template.priority,
            assigned_to,
            due_date,
            created_by: req.user._id,
            company: req.user.company,
            status: 'pending'
        });

        await task.save();
        await task.populate('assigned_to', 'name');
        await task.populate('created_by', 'name');

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        console.error('Create task from template error:', error);
        res.status(500).json({ success: false, error: 'Failed to create task from template' });
    }
};

/**
 * Update a task template
 */
const updateTemplate = async (req, res) => {
    try {
        const template = await TaskTemplate.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company },
            req.body,
            { new: true }
        ).populate('created_by', 'name email');

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        res.json({ success: true, data: template });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ success: false, error: 'Failed to update template' });
    }
};

/**
 * Delete a task template (soft delete)
 */
const deleteTemplate = async (req, res) => {
    try {
        const template = await TaskTemplate.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company },
            { is_active: false },
            { new: true }
        );

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete template' });
    }
};

module.exports = {
    getTemplates,
    createTemplate,
    createTaskFromTemplate,
    updateTemplate,
    deleteTemplate
};

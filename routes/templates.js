const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
    getTemplates,
    createTemplate,
    createTaskFromTemplate,
    updateTemplate,
    deleteTemplate
} = require('../controllers/templateController');

/**
 * @swagger
 * /templates:
 *   get:
 *     summary: Get all task templates
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of task templates
 */
router.get('/', auth, getTemplates);

/**
 * @swagger
 * /templates:
 *   post:
 *     summary: Create a new task template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - title
 *             properties:
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       201:
 *         description: Template created successfully
 */
router.post('/', auth, authorize(['manager', 'admin']), [
    body('name').notEmpty().withMessage('Template name is required'),
    body('title').notEmpty().withMessage('Title is required')
], createTemplate);

/**
 * @swagger
 * /templates/create-task:
 *   post:
 *     summary: Create a task from a template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Task created from template
 */
router.post('/create-task', auth, authorize(['manager', 'admin']), [
    body('templateId').notEmpty().withMessage('Template ID is required'),
    body('assigned_to').notEmpty().withMessage('Assignee is required')
], createTaskFromTemplate);

router.put('/:id', auth, authorize(['manager', 'admin']), updateTemplate);
router.delete('/:id', auth, authorize(['manager', 'admin']), deleteTemplate);

module.exports = router;

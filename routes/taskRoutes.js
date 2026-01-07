const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    getTasksByStatus,
    getOverdueTasks
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { validateTask, validateObjectId } = require('../middleware/validation');

// All routes are protected
router.use(protect);

// Task routes for a specific board
router.route('/boards/:boardId/tasks')
    .get(validateObjectId('boardId'), getTasks)
    .post(validateObjectId('boardId'), validateTask, createTask);

// Special task queries
router.get('/boards/:boardId/tasks/status/:status', validateObjectId('boardId'), getTasksByStatus);
router.get('/boards/:boardId/tasks/overdue', validateObjectId('boardId'), getOverdueTasks);

// Individual task routes
router.route('/:id')
    .get(validateObjectId('id'), getTask)
    .put(validateObjectId('id'), validateTask, updateTask)
    .delete(validateObjectId('id'), deleteTask);

module.exports = router;

const Task = require('../models/Task');
const Board = require('../models/Board');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// @desc    Get all tasks for a board
// @route   GET /api/boards/:boardId/tasks
// @access  Private
const getTasks = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const {
            page = 1,
            limit = 50,
            status,
            priority,
            search,
            sort = 'position'
        } = req.query;

        // Check if board exists and user has access
        const board = await Board.findById(boardId);
        if (!board) {
            return next(new AppError('Board not found', 404));
        }

        if (!board.hasAccess(req.user.id)) {
            return next(new AppError('Not authorized to access this board', 403));
        }

        // Build query
        const query = { board: boardId };

        if (status) {
            query.status = status;
        }

        if (priority) {
            query.priority = priority;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Task.countDocuments(query);

        res.status(200).json({
            success: true,
            count: tasks.length,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            tasks
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('board', 'name');

        if (!task) {
            return next(new AppError('Task not found', 404));
        }

        // Check if user has access to the board
        const board = await Board.findById(task.board._id);
        if (!board.hasAccess(req.user.id)) {
            return next(new AppError('Not authorized to access this task', 403));
        }

        res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new task
// @route   POST /api/boards/:boardId/tasks
// @access  Private
const createTask = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { title, description, status, priority, dueDate, assignedTo, tags } = req.body;

        // Check if board exists and user has access
        const board = await Board.findById(boardId);
        if (!board) {
            return next(new AppError('Board not found', 404));
        }

        if (!board.canEdit(req.user.id)) {
            return next(new AppError('Not authorized to create tasks in this board', 403));
        }

        // Get the highest position for this board
        const highestPositionTask = await Task.findOne({ board: boardId })
            .sort({ position: -1 });

        const position = highestPositionTask ? highestPositionTask.position + 1 : 0;

        const task = await Task.create({
            title,
            description,
            board: boardId,
            createdBy: req.user.id,
            assignedTo,
            status,
            priority,
            dueDate,
            tags,
            position
        });

        await task.populate('assignedTo', 'name email');
        await task.populate('createdBy', 'name email');

        logger.info(`Task created: ${task.title} in board ${board.name}`);

        res.status(201).json({
            success: true,
            task
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return next(new AppError('Task not found', 404));
        }

        // Check if user has access to the board
        const board = await Board.findById(task.board);
        if (!board.canEdit(req.user.id)) {
            return next(new AppError('Not authorized to update this task', 403));
        }

        const { title, description, status, priority, dueDate, assignedTo, tags, position } = req.body;

        task = await Task.findByIdAndUpdate(
            req.params.id,
            { title, description, status, priority, dueDate, assignedTo, tags, position },
            { new: true, runValidators: true }
        )
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        logger.info(`Task updated: ${task.title}`);

        res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return next(new AppError('Task not found', 404));
        }

        // Check if user has access to the board
        const board = await Board.findById(task.board);
        if (!board.canEdit(req.user.id)) {
            return next(new AppError('Not authorized to delete this task', 403));
        }

        await task.deleteOne();

        logger.info(`Task deleted: ${task.title}`);

        res.status(200).json({
            success: true,
            message: 'Task deleted'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get tasks by status
// @route   GET /api/boards/:boardId/tasks/status/:status
// @access  Private
const getTasksByStatus = async (req, res, next) => {
    try {
        const { boardId, status } = req.params;

        // Check if board exists and user has access
        const board = await Board.findById(boardId);
        if (!board) {
            return next(new AppError('Board not found', 404));
        }

        if (!board.hasAccess(req.user.id)) {
            return next(new AppError('Not authorized to access this board', 403));
        }

        const tasks = await Task.getByStatus(boardId, status);

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get overdue tasks
// @route   GET /api/boards/:boardId/tasks/overdue
// @access  Private
const getOverdueTasks = async (req, res, next) => {
    try {
        const { boardId } = req.params;

        // Check if board exists and user has access
        const board = await Board.findById(boardId);
        if (!board) {
            return next(new AppError('Board not found', 404));
        }

        if (!board.hasAccess(req.user.id)) {
            return next(new AppError('Not authorized to access this board', 403));
        }

        const tasks = await Task.find({
            board: boardId,
            dueDate: { $lt: new Date() },
            status: { $ne: 'done' }
        })
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .sort({ dueDate: 1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    getTasksByStatus,
    getOverdueTasks
};

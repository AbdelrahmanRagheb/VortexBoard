const Board = require('../models/Board');
const Task = require('../models/Task');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// @desc    Get all boards for logged in user
// @route   GET /api/boards
// @access  Private
const getBoards = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

        // Find boards where user is owner or collaborator
        const boards = await Board.find({
            $or: [
                { owner: req.user.id },
                { 'collaborators.user': req.user.id }
            ]
        })
            .populate('owner', 'name email')
            .populate('collaborators.user', 'name email')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Board.countDocuments({
            $or: [
                { owner: req.user.id },
                { 'collaborators.user': req.user.id }
            ]
        });

        res.status(200).json({
            success: true,
            count: boards.length,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            boards
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single board
// @route   GET /api/boards/:id
// @access  Private
const getBoard = async (req, res, next) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('collaborators.user', 'name email');

        if (!board) {
            return next(new AppError('Board not found', 404));
        }

        // Check if user has access to this board
        if (!board.hasAccess(req.user.id)) {
            return next(new AppError('Not authorized to access this board', 403));
        }

        res.status(200).json({
            success: true,
            board
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res, next) => {
    try {
        const { name, description, color } = req.body;

        const board = await Board.create({
            name,
            description,
            color,
            owner: req.user.id
        });

        logger.info(`Board created: ${board.name} by user ${req.user.email}`);

        res.status(201).json({
            success: true,
            board
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
const updateBoard = async (req, res, next) => {
    try {
        let board = await Board.findById(req.params.id);

        if (!board) {
            return next(new AppError('Board not found', 404));
        }

        // Check if user can edit this board
        if (!board.canEdit(req.user.id)) {
            return next(new AppError('Not authorized to update this board', 403));
        }

        const { name, description, color } = req.body;

        board = await Board.findByIdAndUpdate(
            req.params.id,
            { name, description, color },
            { new: true, runValidators: true }
        );

        logger.info(`Board updated: ${board.name} by user ${req.user.email}`);

        res.status(200).json({
            success: true,
            board
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
const deleteBoard = async (req, res, next) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return next(new AppError('Board not found', 404));
        }

        // Only owner can delete board
        if (board.owner.toString() !== req.user.id) {
            return next(new AppError('Not authorized to delete this board', 403));
        }

        // Delete all tasks associated with this board
        await Task.deleteMany({ board: req.params.id });

        await board.deleteOne();

        logger.info(`Board deleted: ${board.name} by user ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Board and associated tasks deleted'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add collaborator to board
// @route   POST /api/boards/:id/collaborators
// @access  Private
const addCollaborator = async (req, res, next) => {
    try {
        const { userId, permission = 'read' } = req.body;

        if (!userId) {
            return next(new AppError('User ID is required', 400));
        }

        const board = await Board.findById(req.params.id);

        if (!board) {
            return next(new AppError('Board not found', 404));
        }

        // Only owner can add collaborators
        if (board.owner.toString() !== req.user.id) {
            return next(new AppError('Not authorized to add collaborators', 403));
        }

        // Check if user is already a collaborator
        const isCollaborator = board.collaborators.some(
            collab => collab.user.toString() === userId
        );

        if (isCollaborator) {
            return next(new AppError('User is already a collaborator', 400));
        }

        board.collaborators.push({ user: userId, permission });
        await board.save();

        await board.populate('collaborators.user', 'name email');

        logger.info(`Collaborator added to board: ${board.name}`);

        res.status(200).json({
            success: true,
            board
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove collaborator from board
// @route   DELETE /api/boards/:id/collaborators/:userId
// @access  Private
const removeCollaborator = async (req, res, next) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return next(new AppError('Board not found', 404));
        }

        // Only owner can remove collaborators
        if (board.owner.toString() !== req.user.id) {
            return next(new AppError('Not authorized to remove collaborators', 403));
        }

        board.collaborators = board.collaborators.filter(
            collab => collab.user.toString() !== req.params.userId
        );

        await board.save();

        logger.info(`Collaborator removed from board: ${board.name}`);

        res.status(200).json({
            success: true,
            board
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBoards,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    addCollaborator,
    removeCollaborator
};

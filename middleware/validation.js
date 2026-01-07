const validator = require('validator');
const { AppError } = require('../utils/errorHandler');

// Validate user registration
const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    if (!name || name.trim().length === 0) {
        errors.push('Name is required');
    }

    if (!email || !validator.isEmail(email)) {
        errors.push('Valid email is required');
    }

    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    if (errors.length > 0) {
        return next(new AppError(errors.join(', '), 400));
    }

    next();
};

// Validate user login
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !validator.isEmail(email)) {
        errors.push('Valid email is required');
    }

    if (!password) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return next(new AppError(errors.join(', '), 400));
    }

    next();
};

// Validate board creation/update
const validateBoard = (req, res, next) => {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
        return next(new AppError('Board name is required', 400));
    }

    if (name.length > 100) {
        return next(new AppError('Board name cannot exceed 100 characters', 400));
    }

    next();
};

// Validate task creation/update
const validateTask = (req, res, next) => {
    const { title, status, priority } = req.body;
    const errors = [];

    if (!title || title.trim().length === 0) {
        errors.push('Task title is required');
    }

    if (title && title.length > 200) {
        errors.push('Task title cannot exceed 200 characters');
    }

    if (status && !['todo', 'in-progress', 'done'].includes(status)) {
        errors.push('Status must be one of: todo, in-progress, done');
    }

    if (priority && !['low', 'medium', 'high'].includes(priority)) {
        errors.push('Priority must be one of: low, medium, high');
    }

    if (errors.length > 0) {
        return next(new AppError(errors.join(', '), 400));
    }

    next();
};

// Validate MongoDB ObjectId
const validateObjectId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];

        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return next(new AppError('Invalid ID format', 400));
        }

        next();
    };
};

module.exports = {
    validateRegister,
    validateLogin,
    validateBoard,
    validateTask,
    validateObjectId
};

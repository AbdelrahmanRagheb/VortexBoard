const Notification = require('../models/Notification');
const { AppError } = require('../utils/errorHandler');

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const query = { recipient: req.user.id };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .populate('sender', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.getUnreadCount(req.user.id);

        res.status(200).json({
            success: true,
            count: notifications.length,
            total,
            unreadCount,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            notifications
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return next(new AppError('Notification not found', 404));
        }

        if (notification.recipient.toString() !== req.user.id) {
            return next(new AppError('Not authorized', 403));
        }

        await notification.markAsRead();

        res.status(200).json({
            success: true,
            notification
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.markAllAsRead(req.user.id);

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return next(new AppError('Notification not found', 404));
        }

        if (notification.recipient.toString() !== req.user.id) {
            return next(new AppError('Not authorized', 403));
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.getUnreadCount(req.user.id);

        res.status(200).json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
};

const Board = require('../models/Board');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { AppError } = require('../utils/errorHandler');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get user's boards
        const boards = await Board.find({
            $or: [
                { owner: userId },
                { 'collaborators.user': userId }
            ]
        });

        const boardIds = boards.map(board => board._id);

        // Total tasks
        const totalTasks = await Task.countDocuments({ board: { $in: boardIds } });

        // Tasks by status
        const tasksByStatus = await Task.aggregate([
            { $match: { board: { $in: boardIds } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Tasks by priority
        const tasksByPriority = await Task.aggregate([
            { $match: { board: { $in: boardIds } } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        // Overdue tasks
        const overdueTasks = await Task.countDocuments({
            board: { $in: boardIds },
            dueDate: { $lt: new Date() },
            status: { $ne: 'done' }
        });

        // Tasks due this week
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);

        const tasksDueThisWeek = await Task.countDocuments({
            board: { $in: boardIds },
            dueDate: { $gte: new Date(), $lte: weekFromNow },
            status: { $ne: 'done' }
        });

        // Tasks assigned to user
        const tasksAssignedToMe = await Task.countDocuments({
            board: { $in: boardIds },
            assignedTo: userId
        });

        // Tasks created by user
        const tasksCreatedByMe = await Task.countDocuments({
            board: { $in: boardIds },
            createdBy: userId
        });

        // Completion rate
        const completedTasks = await Task.countDocuments({
            board: { $in: boardIds },
            status: 'done'
        });
        const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentActivity = await ActivityLog.find({
            user: userId,
            timestamp: { $gte: sevenDaysAgo }
        }).sort({ timestamp: -1 }).limit(10);

        // Task creation trend (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const taskCreationTrend = await Task.aggregate([
            {
                $match: {
                    board: { $in: boardIds },
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            analytics: {
                overview: {
                    totalBoards: boards.length,
                    totalTasks,
                    tasksAssignedToMe,
                    tasksCreatedByMe,
                    overdueTasks,
                    tasksDueThisWeek,
                    completionRate: parseFloat(completionRate)
                },
                tasksByStatus: tasksByStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                tasksByPriority: tasksByPriority.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                recentActivity,
                taskCreationTrend
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get board analytics
// @route   GET /api/analytics/boards/:boardId
// @access  Private
const getBoardAnalytics = async (req, res, next) => {
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

        // Total tasks
        const totalTasks = await Task.countDocuments({ board: boardId });

        // Tasks by status
        const tasksByStatus = await Task.aggregate([
            { $match: { board: board._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Tasks by priority
        const tasksByPriority = await Task.aggregate([
            { $match: { board: board._id } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        // Tasks by assignee
        const tasksByAssignee = await Task.aggregate([
            { $match: { board: board._id, assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    name: '$user.name',
                    email: '$user.email',
                    count: 1
                }
            }
        ]);

        // Average completion time
        const completedTasks = await Task.find({
            board: boardId,
            status: 'done'
        }).select('createdAt updatedAt');

        let avgCompletionTime = 0;
        if (completedTasks.length > 0) {
            const totalTime = completedTasks.reduce((sum, task) => {
                return sum + (task.updatedAt - task.createdAt);
            }, 0);
            avgCompletionTime = Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24)); // in days
        }

        // Overdue tasks
        const overdueTasks = await Task.countDocuments({
            board: boardId,
            dueDate: { $lt: new Date() },
            status: { $ne: 'done' }
        });

        // Board activity
        const boardActivity = await ActivityLog.find({
            entityType: 'board',
            entityId: boardId
        }).sort({ timestamp: -1 }).limit(20).populate('user', 'name email');

        res.status(200).json({
            success: true,
            analytics: {
                boardName: board.name,
                totalTasks,
                tasksByStatus: tasksByStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                tasksByPriority: tasksByPriority.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                tasksByAssignee,
                avgCompletionTime,
                overdueTasks,
                collaborators: board.collaborators.length,
                boardActivity
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user productivity stats
// @route   GET /api/analytics/productivity
// @access  Private
const getProductivityStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { period = '30' } = req.query; // days

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Tasks completed in period
        const tasksCompleted = await Task.countDocuments({
            assignedTo: userId,
            status: 'done',
            updatedAt: { $gte: startDate }
        });

        // Tasks created in period
        const tasksCreated = await Task.countDocuments({
            createdBy: userId,
            createdAt: { $gte: startDate }
        });

        // Current active tasks
        const activeTasks = await Task.countDocuments({
            assignedTo: userId,
            status: { $in: ['todo', 'in-progress'] }
        });

        // On-time completion rate
        const completedOnTime = await Task.countDocuments({
            assignedTo: userId,
            status: 'done',
            updatedAt: { $gte: startDate, $lte: '$dueDate' }
        });

        const onTimeRate = tasksCompleted > 0 ? ((completedOnTime / tasksCompleted) * 100).toFixed(2) : 0;

        // Daily activity
        const dailyActivity = await Task.aggregate([
            {
                $match: {
                    assignedTo: userId,
                    updatedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
                    tasksUpdated: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            productivity: {
                period: `${period} days`,
                tasksCompleted,
                tasksCreated,
                activeTasks,
                onTimeCompletionRate: parseFloat(onTimeRate),
                dailyActivity
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardAnalytics,
    getBoardAnalytics,
    getProductivityStats
};

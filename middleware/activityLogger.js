const ActivityLog = require('../models/ActivityLog');

// Middleware to log activity
const logActivity = (action, entityType) => {
    return async (req, res, next) => {
        // Store original res.json
        const originalJson = res.json.bind(res);

        // Override res.json
        res.json = function (data) {
            // Only log if request was successful
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                // Determine entity ID from response or request
                let entityId = null;

                if (req.params.id) {
                    entityId = req.params.id;
                } else if (req.params.boardId) {
                    entityId = req.params.boardId;
                } else if (data && data.board && data.board._id) {
                    entityId = data.board._id;
                } else if (data && data.task && data.task._id) {
                    entityId = data.task._id;
                } else if (data && data.user && data.user.id) {
                    entityId = data.user.id;
                }

                // Log activity asynchronously (don't wait)
                if (entityId) {
                    ActivityLog.logActivity({
                        user: req.user.id,
                        action,
                        entityType,
                        entityId,
                        metadata: {
                            method: req.method,
                            path: req.originalUrl,
                            body: req.body
                        },
                        ipAddress: req.ip,
                        userAgent: req.get('user-agent')
                    }).catch(err => {
                        console.error('Error logging activity:', err);
                    });
                }
            }

            // Call original json method
            return originalJson(data);
        };

        next();
    };
};

module.exports = logActivity;

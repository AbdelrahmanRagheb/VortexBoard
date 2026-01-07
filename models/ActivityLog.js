const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'user.register',
            'user.login',
            'user.logout',
            'user.update',
            'board.create',
            'board.update',
            'board.delete',
            'board.share',
            'task.create',
            'task.update',
            'task.delete',
            'task.assign',
            'task.complete',
            'comment.create',
            'comment.delete'
        ]
    },
    entityType: {
        type: String,
        enum: ['user', 'board', 'task', 'comment'],
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

// TTL index - automatically delete logs older than 90 days
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Static method to log activity
activityLogSchema.statics.logActivity = async function (data) {
    try {
        return await this.create(data);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// Static method to get user activity
activityLogSchema.statics.getUserActivity = function (userId, limit = 50) {
    return this.find({ user: userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('user', 'name email');
};

// Static method to get entity activity
activityLogSchema.statics.getEntityActivity = function (entityType, entityId, limit = 50) {
    return this.find({ entityType, entityId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('user', 'name email');
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        required: true,
        enum: [
            'task_assigned',
            'task_completed',
            'task_due_soon',
            'task_overdue',
            'board_shared',
            'comment_added',
            'comment_mention',
            'collaborator_added',
            'task_updated'
        ]
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedEntity: {
        entityType: {
            type: String,
            enum: ['task', 'board', 'comment'],
            required: true
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

// TTL index - delete read notifications older than 30 days
notificationSchema.index(
    { readAt: 1 },
    { expireAfterSeconds: 2592000, partialFilterExpression: { isRead: true } }
);

// Method to mark as read
notificationSchema.methods.markAsRead = async function () {
    this.isRead = true;
    this.readAt = new Date();
    return await this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
    return await this.create(data);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function (userId) {
    return this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function (userId) {
    return this.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, readAt: new Date() }
    );
};

module.exports = mongoose.model('Notification', notificationSchema);

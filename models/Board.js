const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a board name'],
        trim: true,
        maxlength: [100, 'Board name cannot be more than 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Board must have an owner']
    },
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        permission: {
            type: String,
            enum: ['read', 'write'],
            default: 'read'
        }
    }],
    color: {
        type: String,
        default: '#3B82F6' // Default blue color
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for tasks in this board
boardSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'board'
});

// Index for faster queries
boardSchema.index({ owner: 1, createdAt: -1 });
boardSchema.index({ 'collaborators.user': 1 });

// Method to check if user has access to board
boardSchema.methods.hasAccess = function (userId) {
    // Owner always has access
    if (this.owner.toString() === userId.toString()) {
        return true;
    }

    // Check if user is a collaborator
    return this.collaborators.some(
        collab => collab.user.toString() === userId.toString()
    );
};

// Method to check if user can edit board
boardSchema.methods.canEdit = function (userId) {
    // Owner can always edit
    if (this.owner.toString() === userId.toString()) {
        return true;
    }

    // Check if user has write permission
    const collaborator = this.collaborators.find(
        collab => collab.user.toString() === userId.toString()
    );

    return collaborator && collaborator.permission === 'write';
};

module.exports = mongoose.model('Board', boardSchema);

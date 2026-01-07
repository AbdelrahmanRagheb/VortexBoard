const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a task title'],
        trim: true,
        maxlength: [200, 'Task title cannot be more than 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: [true, 'Task must belong to a board']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Task must have a creator']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'done'],
        default: 'todo'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    dueDate: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true
    }],
    position: {
        type: Number,
        default: 0
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
    timestamps: true
});

// Indexes for faster queries
taskSchema.index({ board: 1, status: 1 });
taskSchema.index({ board: 1, priority: 1 });
taskSchema.index({ board: 1, position: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1 });

// Text index for search functionality
taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Method to check if task is overdue
taskSchema.methods.isOverdue = function () {
    if (!this.dueDate) return false;
    return this.dueDate < new Date() && this.status !== 'done';
};

// Static method to get tasks by status
taskSchema.statics.getByStatus = function (boardId, status) {
    return this.find({ board: boardId, status })
        .sort({ position: 1, createdAt: -1 })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
};

module.exports = mongoose.model('Task', taskSchema);

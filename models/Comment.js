const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: [true, 'Comment must belong to a task']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Comment must have an author']
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for replies
commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentComment'
});

// Indexes
commentSchema.index({ task: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

// Pre-save middleware to extract mentions
commentSchema.pre('save', function (next) {
    if (this.isModified('content')) {
        // Extract @mentions from content
        const mentionRegex = /@\[([^\]]+)\]\(([a-f\d]{24})\)/g;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(this.content)) !== null) {
            mentions.push(match[2]);
        }

        this.mentions = [...new Set(mentions)]; // Remove duplicates
    }
    next();
});

module.exports = mongoose.model('Comment', commentSchema);

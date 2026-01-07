const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialize();
    }

    initialize() {
        // Configure email transporter
        // For development, use ethereal.email or mailtrap.io
        // For production, use SendGrid, AWS SES, or similar

        if (process.env.EMAIL_SERVICE === 'gmail') {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
            this.transporter = nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                auth: {
                    user: 'apikey',
                    pass: process.env.SENDGRID_API_KEY
                }
            });
        } else {
            // Default to SMTP configuration
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
                port: process.env.SMTP_PORT || 2525,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });
        }
    }

    async sendEmail(options) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'VortexBoard <noreply@vortexboard.com>',
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            logger.error(`Error sending email: ${error.message}`);
            throw error;
        }
    }

    async sendWelcomeEmail(user) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">Welcome to VortexBoard! 🌀</h1>
        <p>Hi ${user.name},</p>
        <p>Thank you for joining VortexBoard! We're excited to have you on board.</p>
        <p>VortexBoard helps you manage your tasks and collaborate with your team efficiently.</p>
        <h3>Getting Started:</h3>
        <ul>
          <li>Create your first board</li>
          <li>Add tasks and set priorities</li>
          <li>Invite team members to collaborate</li>
          <li>Track your progress with analytics</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Happy organizing!</p>
        <p style="color: #666;">The VortexBoard Team</p>
      </div>
    `;

        return await this.sendEmail({
            to: user.email,
            subject: 'Welcome to VortexBoard!',
            html
        });
    }

    async sendTaskAssignedEmail(task, assignee, assigner) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">New Task Assigned</h2>
        <p>Hi ${assignee.name},</p>
        <p>${assigner.name} has assigned you a new task:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${task.title}</h3>
          <p>${task.description || 'No description provided'}</p>
          <p><strong>Priority:</strong> <span style="color: ${task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F59E0B' : '#10B981'}">${task.priority}</span></p>
          ${task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
        </div>
        <p>Log in to VortexBoard to view the full details and get started!</p>
        <p style="color: #666;">The VortexBoard Team</p>
      </div>
    `;

        return await this.sendEmail({
            to: assignee.email,
            subject: `New Task Assigned: ${task.title}`,
            html
        });
    }

    async sendTaskDueReminderEmail(task, user) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">⏰ Task Due Soon</h2>
        <p>Hi ${user.name},</p>
        <p>This is a reminder that the following task is due soon:</p>
        <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <h3 style="margin-top: 0;">${task.title}</h3>
          <p>${task.description || 'No description provided'}</p>
          <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${task.status}</p>
        </div>
        <p>Don't forget to complete it on time!</p>
        <p style="color: #666;">The VortexBoard Team</p>
      </div>
    `;

        return await this.sendEmail({
            to: user.email,
            subject: `Reminder: Task "${task.title}" is due soon`,
            html
        });
    }

    async sendBoardSharedEmail(board, recipient, sharer, permission) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Board Shared With You</h2>
        <p>Hi ${recipient.name},</p>
        <p>${sharer.name} has shared a board with you:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${board.name}</h3>
          <p>${board.description || 'No description provided'}</p>
          <p><strong>Your Permission:</strong> ${permission === 'write' ? 'Can Edit' : 'Read Only'}</p>
        </div>
        <p>Log in to VortexBoard to start collaborating!</p>
        <p style="color: #666;">The VortexBoard Team</p>
      </div>
    `;

        return await this.sendEmail({
            to: recipient.email,
            subject: `${sharer.name} shared a board with you: ${board.name}`,
            html
        });
    }

    async sendCommentMentionEmail(comment, task, mentionedUser, author) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">You were mentioned in a comment</h2>
        <p>Hi ${mentionedUser.name},</p>
        <p>${author.name} mentioned you in a comment on task "${task.title}":</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
          <p style="margin: 0;">${comment.content}</p>
        </div>
        <p>Log in to VortexBoard to view and respond!</p>
        <p style="color: #666;">The VortexBoard Team</p>
      </div>
    `;

        return await this.sendEmail({
            to: mentionedUser.email,
            subject: `${author.name} mentioned you in a comment`,
            html
        });
    }
}

// Export singleton instance
module.exports = new EmailService();

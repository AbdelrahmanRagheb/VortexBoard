const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'VortexBoard API Documentation',
            version: '1.0.0',
            description: 'A professional Task Management API with Express.js, MongoDB, and JWT authentication',
            contact: {
                name: 'API Support',
                email: 'support@vortexboard.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server'
            },
            {
                url: 'https://api.vortexboard.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'User ID'
                        },
                        name: {
                            type: 'string',
                            description: 'User name'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email'
                        },
                        role: {
                            type: 'string',
                            enum: ['user', 'admin'],
                            description: 'User role'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Board: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string'
                        },
                        name: {
                            type: 'string',
                            description: 'Board name'
                        },
                        description: {
                            type: 'string',
                            description: 'Board description'
                        },
                        owner: {
                            type: 'string',
                            description: 'User ID of board owner'
                        },
                        color: {
                            type: 'string',
                            description: 'Board color in hex format'
                        },
                        collaborators: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    user: {
                                        type: 'string'
                                    },
                                    permission: {
                                        type: 'string',
                                        enum: ['read', 'write']
                                    }
                                }
                            }
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Task: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string'
                        },
                        title: {
                            type: 'string',
                            description: 'Task title'
                        },
                        description: {
                            type: 'string',
                            description: 'Task description'
                        },
                        board: {
                            type: 'string',
                            description: 'Board ID'
                        },
                        status: {
                            type: 'string',
                            enum: ['todo', 'in-progress', 'done'],
                            description: 'Task status'
                        },
                        priority: {
                            type: 'string',
                            enum: ['low', 'medium', 'high'],
                            description: 'Task priority'
                        },
                        dueDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Task due date'
                        },
                        assignedTo: {
                            type: 'string',
                            description: 'User ID of assignee'
                        },
                        tags: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            description: 'Error message'
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication endpoints'
            },
            {
                name: 'Boards',
                description: 'Board management endpoints'
            },
            {
                name: 'Tasks',
                description: 'Task management endpoints'
            },
            {
                name: 'Analytics',
                description: 'Analytics and statistics endpoints'
            },
            {
                name: 'Notifications',
                description: 'Notification management endpoints'
            }
        ]
    },
    apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
    specs,
    swaggerUi
};

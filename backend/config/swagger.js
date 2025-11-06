/**
 * Swagger/OpenAPI Configuration
 * API Documentation Setup
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM System API',
      version: '1.0.0',
      description: 'Comprehensive CRM System API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@crm.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      },
      {
        url: 'http://localhost:5000/api/v1',
        description: 'API Version 1'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        // Standard Response
        SuccessResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            statusCode: {
              type: 'integer',
              example: 200
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            data: {
              type: 'object'
            }
          }
        },
        
        // Error Response
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            statusCode: {
              type: 'integer',
              example: 400
            },
            errorCode: {
              type: 'string',
              example: 'VALIDATION_ERROR'
            },
            message: {
              type: 'string',
              example: 'Validation failed'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        
        // Pagination Response
        PaginatedResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            statusCode: {
              type: 'integer',
              example: 200
            },
            message: {
              type: 'string'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            data: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: {
                  type: 'integer',
                  example: 1
                },
                totalPages: {
                  type: 'integer',
                  example: 10
                },
                totalItems: {
                  type: 'integer',
                  example: 100
                },
                itemsPerPage: {
                  type: 'integer',
                  example: 10
                },
                hasNextPage: {
                  type: 'boolean'
                },
                hasPreviousPage: {
                  type: 'boolean'
                }
              }
            }
          }
        },
        
        // User Schema
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            username: {
              type: 'string',
              example: 'john_doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            role: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string', example: 'admin' }
              }
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              example: 'active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        // Client Schema
        Client: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Acme Corporation'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'contact@acme.com'
            },
            phone: {
              type: 'string',
              example: '+1 (555) 123-4567'
            },
            company: {
              type: 'string',
              example: 'Acme Corp'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              example: 'active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        // Inventory Item Schema
        InventoryItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Product A'
            },
            sku: {
              type: 'string',
              example: 'SKU-001'
            },
            quantity: {
              type: 'integer',
              example: 100
            },
            price: {
              type: 'number',
              format: 'float',
              example: 99.99
            },
            category: {
              type: 'string',
              example: 'Electronics'
            },
            description: {
              type: 'string',
              example: 'High-quality product'
            }
          }
        },
        
        // Login Request
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              example: 'admin'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'SecurePass123!'
            }
          }
        },
        
        // Login Response
        LoginResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                user: {
                  $ref: '#/components/schemas/User'
                },
                permissions: {
                  type: 'object'
                }
              }
            }
          }
        }
      },
      
      // Common Parameters
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field (prefix with - for descending)',
          schema: {
            type: 'string',
            example: '-createdAt'
          }
        },
        IdParam: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Resource ID',
          schema: {
            type: 'string',
            example: '507f1f77bcf86cd799439011'
          }
        }
      },
      
      // Common Responses
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'error',
                statusCode: 401,
                errorCode: 'AUTH_ERROR',
                message: 'Authentication required',
                timestamp: '2025-11-05T10:30:00.000Z'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'error',
                statusCode: 403,
                errorCode: 'FORBIDDEN',
                message: 'Access denied',
                timestamp: '2025-11-05T10:30:00.000Z'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'error',
                statusCode: 404,
                errorCode: 'NOT_FOUND',
                message: 'Resource not found',
                timestamp: '2025-11-05T10:30:00.000Z'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'error',
                statusCode: 400,
                errorCode: 'VALIDATION_ERROR',
                message: 'Validation failed',
                errors: [
                  {
                    field: 'email',
                    message: 'Invalid email format',
                    value: 'invalid'
                  }
                ],
                timestamp: '2025-11-05T10:30:00.000Z'
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'error',
                statusCode: 500,
                errorCode: 'INTERNAL_SERVER_ERROR',
                message: 'An error occurred',
                timestamp: '2025-11-05T10:30:00.000Z'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Roles',
        description: 'Role management endpoints'
      },
      {
        name: 'Clients',
        description: 'Client management endpoints'
      },
      {
        name: 'Inventory',
        description: 'Inventory management endpoints'
      },
      {
        name: 'Quotes',
        description: 'Quotation management endpoints'
      },
      {
        name: 'Meetings',
        description: 'Meeting management endpoints'
      },
      {
        name: 'Notes',
        description: 'Note management endpoints'
      },
      {
        name: 'Activities',
        description: 'Activity logging endpoints'
      },
      {
        name: 'System',
        description: 'System information and health endpoints'
      }
    ]
  },
  apis: ['./routes/*.js', './server.js'] // Path to API routes
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = {
  swaggerSpec,
  swaggerUi
};

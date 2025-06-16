# LUMO Inventory Management System - API Documentation

## Overview

The LUMO Inventory Management System provides a comprehensive REST API for managing inventory, users, categories, locations, and sales. The API follows RESTful conventions and returns JSON responses.

**Base URL**: `http://localhost:3000/api` (development)  
**Authentication**: JWT Bearer tokens  
**Content-Type**: `application/json`

## Authentication

### POST /api/auth/login
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": {
      "id": "role-id",
      "name": "Admin",
      "description": "Administrator role"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request`: Invalid email or password format
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server error

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "roleId": "role-id"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "new-user-id",
    "email": "newuser@example.com",
    "name": "New User",
    "role": {
      "id": "role-id",
      "name": "User",
      "description": "Standard user role"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": {
      "id": "role-id",
      "name": "Admin",
      "permissions": ["inventory:read", "inventory:write", "users:read"]
    }
  }
}
```

### POST /api/auth/logout
Logout the current user (invalidate token).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Categories

### GET /api/categories
Retrieve all categories.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `search` (optional): Filter categories by name
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "categories": [
    {
      "id": "category-id",
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "createdAt": "2025-01-27T10:00:00Z",
      "updatedAt": "2025-01-27T10:00:00Z",
      "createdBy": {
        "id": "user-id",
        "name": "Admin User"
      },
      "_count": {
        "inventoryItems": 15
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### POST /api/categories
Create a new category.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "New Category",
  "description": "Category description"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "category": {
    "id": "new-category-id",
    "name": "New Category",
    "description": "Category description",
    "createdAt": "2025-01-27T10:00:00Z",
    "updatedAt": "2025-01-27T10:00:00Z",
    "createdById": "user-id"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or category name already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions

### GET /api/categories/[id]
Retrieve a specific category by ID.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "category": {
    "id": "category-id",
    "name": "Electronics",
    "description": "Electronic devices and gadgets",
    "createdAt": "2025-01-27T10:00:00Z",
    "updatedAt": "2025-01-27T10:00:00Z",
    "createdBy": {
      "id": "user-id",
      "name": "Admin User"
    },
    "inventoryItems": [
      {
        "id": "item-id",
        "name": "iPhone 15",
        "sku": "IPHONE-15",
        "currentStock": 10
      }
    ]
  }
}
```

### PUT /api/categories/[id]
Update a specific category.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "Updated Category Name",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "category": {
    "id": "category-id",
    "name": "Updated Category Name",
    "description": "Updated description",
    "updatedAt": "2025-01-27T11:00:00Z"
  }
}
```

### DELETE /api/categories/[id]
Delete a specific category.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Category has associated products and cannot be deleted
- `404 Not Found`: Category not found
- `403 Forbidden`: Insufficient permissions

**Example Error Response:**
```json
{
  "success": false,
  "error": "Cannot delete category. It has 5 associated products."
}
```

## Inventory Items

### GET /api/inventory
Retrieve all inventory items.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `search` (optional): Search by name, SKU, or description
- `categoryId` (optional): Filter by category ID
- `locationId` (optional): Filter by location ID
- `lowStock` (optional): Filter items with stock below minimum level
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Number of results to skip (default: 0)
- `sortBy` (optional): Sort field (name, sku, currentStock, price)
- `sortOrder` (optional): Sort direction (asc, desc)

**Response (200 OK):**
```json
{
  "success": true,
  "items": [
    {
      "id": "item-id",
      "name": "iPhone 15",
      "description": "Latest iPhone model",
      "sku": "IPHONE-15",
      "barcode": "1234567890123",
      "currentStock": 10,
      "minStockLevel": 2,
      "maxLevel": 50,
      "cost": 800.00,
      "price": 1000.00,
      "margin": 20.0,
      "imageUrl": "https://example.com/image.jpg",
      "isActive": true,
      "createdAt": "2025-01-27T10:00:00Z",
      "updatedAt": "2025-01-27T10:00:00Z",
      "category": {
        "id": "category-id",
        "name": "Electronics"
      },
      "location": {
        "id": "location-id",
        "name": "Warehouse A"
      },
      "createdBy": {
        "id": "user-id",
        "name": "Admin User"
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### POST /api/inventory
Create a new inventory item.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "sku": "NEW-PROD-001",
  "barcode": "1234567890123",
  "currentStock": 0,
  "minStockLevel": 5,
  "maxLevel": 100,
  "cost": 50.00,
  "price": 75.00,
  "categoryId": "category-id",
  "locationId": "location-id",
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "item": {
    "id": "new-item-id",
    "name": "New Product",
    "sku": "NEW-PROD-001",
    "currentStock": 0,
    "minStockLevel": 5,
    "cost": 50.00,
    "price": 75.00,
    "margin": 33.33,
    "createdAt": "2025-01-27T10:00:00Z"
  }
}
```

### GET /api/inventory/[id]
Retrieve a specific inventory item.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "item": {
    "id": "item-id",
    "name": "iPhone 15",
    "description": "Latest iPhone model",
    "sku": "IPHONE-15",
    "currentStock": 10,
    "minStockLevel": 2,
    "cost": 800.00,
    "price": 1000.00,
    "category": {
      "id": "category-id",
      "name": "Electronics"
    },
    "stockMovements": [
      {
        "id": "movement-id",
        "type": "IN",
        "quantity": 10,
        "previousStock": 0,
        "newStock": 10,
        "reason": "Initial stock",
        "createdAt": "2025-01-27T10:00:00Z",
        "createdBy": {
          "name": "Admin User"
        }
      }
    ]
  }
}
```

### PUT /api/inventory/[id]
Update a specific inventory item.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "price": 85.00,
  "minStockLevel": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "item": {
    "id": "item-id",
    "name": "Updated Product Name",
    "price": 85.00,
    "minStockLevel": 3,
    "margin": 41.18,
    "updatedAt": "2025-01-27T11:00:00Z"
  }
}
```

### DELETE /api/inventory/[id]
Delete a specific inventory item.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Inventory item deleted successfully"
}
```

## Stock Movements

### GET /api/inventory/movements
Retrieve stock movement history.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `inventoryItemId` (optional): Filter by specific item
- `type` (optional): Filter by movement type (IN, OUT, ADJUSTMENT)
- `startDate` (optional): Filter movements after date (ISO 8601)
- `endDate` (optional): Filter movements before date (ISO 8601)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "movements": [
    {
      "id": "movement-id",
      "type": "IN",
      "quantity": 10,
      "previousStock": 5,
      "newStock": 15,
      "cost": 50.00,
      "price": 75.00,
      "reason": "Purchase order #123",
      "notes": "Received from supplier",
      "createdAt": "2025-01-27T10:00:00Z",
      "inventoryItem": {
        "id": "item-id",
        "name": "Product Name",
        "sku": "PROD-001"
      },
      "location": {
        "id": "location-id",
        "name": "Warehouse A"
      },
      "createdBy": {
        "id": "user-id",
        "name": "Admin User"
      }
    }
  ],
  "total": 1
}
```

### POST /api/inventory/movements
Create a new stock movement.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "inventoryItemId": "item-id",
  "type": "IN",
  "quantity": 10,
  "cost": 50.00,
  "price": 75.00,
  "reason": "Purchase order #123",
  "notes": "Received from supplier",
  "locationId": "location-id"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "movement": {
    "id": "new-movement-id",
    "type": "IN",
    "quantity": 10,
    "previousStock": 5,
    "newStock": 15,
    "createdAt": "2025-01-27T10:00:00Z"
  },
  "updatedItem": {
    "id": "item-id",
    "currentStock": 15
  }
}
```

## Locations

### GET /api/locations
Retrieve all locations.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "locations": [
    {
      "id": "location-id",
      "name": "Warehouse A",
      "description": "Main warehouse facility",
      "isActive": true,
      "createdAt": "2025-01-27T10:00:00Z",
      "_count": {
        "inventoryItems": 25
      }
    }
  ]
}
```

### POST /api/locations
Create a new location.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "New Warehouse",
  "description": "Secondary warehouse facility",
  "isActive": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "location": {
    "id": "new-location-id",
    "name": "New Warehouse",
    "description": "Secondary warehouse facility",
    "isActive": true,
    "createdAt": "2025-01-27T10:00:00Z"
  }
}
```

## Sales

### GET /api/sales
Retrieve all sales records.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `startDate` (optional): Filter sales after date
- `endDate` (optional): Filter sales before date
- `status` (optional): Filter by status (COMPLETED, REFUNDED, CANCELLED)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "sales": [
    {
      "id": "sale-id",
      "total": 150.00,
      "tax": 15.00,
      "discount": 10.00,
      "status": "COMPLETED",
      "notes": "Customer purchase",
      "createdAt": "2025-01-27T10:00:00Z",
      "createdBy": {
        "id": "user-id",
        "name": "Sales User"
      },
      "items": [
        {
          "id": "sale-item-id",
          "quantity": 2,
          "unitPrice": 75.00,
          "totalPrice": 150.00,
          "inventoryItem": {
            "id": "item-id",
            "name": "Product Name",
            "sku": "PROD-001"
          }
        }
      ]
    }
  ],
  "total": 1
}
```

### POST /api/sales
Create a new sale.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "items": [
    {
      "inventoryItemId": "item-id",
      "quantity": 2,
      "unitPrice": 75.00
    }
  ],
  "tax": 15.00,
  "discount": 10.00,
  "notes": "Customer purchase"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "sale": {
    "id": "new-sale-id",
    "total": 150.00,
    "tax": 15.00,
    "discount": 10.00,
    "status": "COMPLETED",
    "createdAt": "2025-01-27T10:00:00Z",
    "items": [
      {
        "id": "sale-item-id",
        "quantity": 2,
        "unitPrice": 75.00,
        "totalPrice": 150.00
      }
    ]
  }
}
```

## Users & Roles

### GET /api/users
Retrieve all users (Admin only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "isActive": true,
      "createdAt": "2025-01-27T10:00:00Z",
      "role": {
        "id": "role-id",
        "name": "Admin",
        "description": "Administrator role"
      }
    }
  ]
}
```

### GET /api/roles
Retrieve all roles.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "roles": [
    {
      "id": "role-id",
      "name": "Admin",
      "description": "Administrator role with full access",
      "isSystem": true,
      "isActive": true,
      "permissions": [
        {
          "id": "permission-id",
          "name": "inventory:read",
          "description": "Read inventory items",
          "resource": "inventory",
          "action": "read"
        }
      ]
    }
  ]
}
```

## Error Handling

All API endpoints follow consistent error response formats:

### Error Response Format
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

### Common Error Codes
- `VALIDATION_ERROR`: Request data validation failed
- `AUTHENTICATION_REQUIRED`: Valid JWT token required
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `DUPLICATE_RESOURCE`: Resource with same identifier already exists
- `FOREIGN_KEY_CONSTRAINT`: Cannot delete resource with dependencies
- `DATABASE_ERROR`: Database operation failed

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- **Authentication endpoints**: 5 requests per minute per IP
- **Read operations**: 100 requests per minute per user
- **Write operations**: 50 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643723400
```

## Pagination

List endpoints support pagination using `limit` and `offset` parameters:

**Request:**
```
GET /api/inventory?limit=20&offset=40
```

**Response:**
```json
{
  "success": true,
  "items": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "hasNext": true,
    "hasPrevious": true
  }
}
```

## Webhooks

The system supports webhooks for real-time notifications:

### Supported Events
- `inventory.stock.low`: Item stock below minimum level
- `inventory.item.created`: New inventory item created
- `inventory.item.updated`: Inventory item updated
- `sale.completed`: Sale transaction completed

### Webhook Payload Format
```json
{
  "event": "inventory.stock.low",
  "timestamp": "2025-01-27T10:00:00Z",
  "data": {
    "item": {
      "id": "item-id",
      "name": "Product Name",
      "currentStock": 1,
      "minStockLevel": 5
    }
  }
}
``` 
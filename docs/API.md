# API Documentation

The HTTSafety Pricing Dashboard provides a RESTful API for managing products and fetching price data.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication
Currently, the API does not require authentication. Rate limiting is applied to prevent abuse.

## Rate Limiting
- **Limit**: 10 requests per minute per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Endpoints

### Health Check

#### GET /api/health
Check the health status of the application and database.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200`: Service is healthy
- `503`: Service is unhealthy

---

### Products

#### GET /api/products
Retrieve all products.

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "brand": "3M",
      "part_number": "2091",
      "size": null,
      "description": "3M 2091 P100 Particulate Filter",
      "category": "Respiratory Protection",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### POST /api/products
Create a new product.

**Request Body:**
```json
{
  "brand": "3M",
  "partNumber": "2091",
  "size": "Medium",
  "description": "3M 2091 P100 Particulate Filter",
  "category": "Respiratory Protection"
}
```

**Response:**
```json
{
  "product": {
    "id": 1,
    "brand": "3M",
    "part_number": "2091",
    "size": "Medium",
    "description": "3M 2091 P100 Particulate Filter",
    "category": "Respiratory Protection",
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Status Codes:**
- `201`: Product created successfully
- `400`: Invalid request data
- `409`: Product already exists

#### GET /api/products/{id}
Retrieve a specific product by ID.

**Parameters:**
- `id` (path): Product ID

**Response:**
```json
{
  "product": {
    "id": 1,
    "brand": "3M",
    "part_number": "2091",
    "size": null,
    "description": "3M 2091 P100 Particulate Filter",
    "category": "Respiratory Protection",
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Status Codes:**
- `200`: Product found
- `404`: Product not found

#### PUT /api/products/{id}
Update a specific product.

**Parameters:**
- `id` (path): Product ID

**Request Body:**
```json
{
  "description": "Updated description",
  "category": "Updated category"
}
```

**Response:**
```json
{
  "product": {
    "id": 1,
    "brand": "3M",
    "part_number": "2091",
    "size": null,
    "description": "Updated description",
    "category": "Updated category",
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**
- `200`: Product updated successfully
- `404`: Product not found

#### DELETE /api/products/{id}
Delete a specific product.

**Parameters:**
- `id` (path): Product ID

**Response:**
```json
{
  "message": "Product deleted successfully"
}
```

**Status Codes:**
- `200`: Product deleted successfully
- `404`: Product not found

---

### Price Fetching

#### POST /api/fetch-prices
Fetch current prices for a product from all suppliers.

**Request Body:**
```json
{
  "brand": "3M",
  "partNumber": "2091",
  "size": "Medium"
}
```

**Response:**
```json
{
  "product": "3M 2091 Medium",
  "prices": [
    {
      "website": "Amazon.ca",
      "price": "$19.99",
      "link": "https://amazon.ca/product/123",
      "availability": "Available",
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    },
    {
      "website": "ULINE",
      "price": "$22.50",
      "link": "https://uline.ca/product/456",
      "availability": "Available",
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    },
    {
      "website": "Brogan Safety",
      "price": "Not Found",
      "availability": "Product not found",
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessionId": "uuid-session-id",
  "duration": 15000
}
```

**Status Codes:**
- `200`: Prices fetched successfully
- `400`: Invalid request data
- `500`: Internal server error

---

### Suppliers

#### GET /api/suppliers
Retrieve all suppliers.

**Response:**
```json
{
  "suppliers": [
    {
      "id": 1,
      "name": "Amazon.ca",
      "website_url": "https://www.amazon.ca",
      "search_url_template": "https://www.amazon.ca/s?k={query}",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### POST /api/suppliers
Create a new supplier.

**Request Body:**
```json
{
  "name": "New Supplier",
  "website_url": "https://newsupplier.com",
  "search_url_template": "https://newsupplier.com/search?q={query}",
  "is_active": true,
  "scraper_config": {
    "selectors": {
      "product": ".product-item",
      "price": ".price",
      "title": ".title"
    }
  }
}
```

**Response:**
```json
{
  "message": "Supplier created successfully",
  "supplierId": 9
}
```

**Status Codes:**
- `201`: Supplier created successfully
- `400`: Invalid request data
- `409`: Supplier already exists

---

### Price Comparison

#### GET /api/price-comparison
Get price comparison data for all products or a specific product.

**Query Parameters:**
- `productId` (optional): Specific product ID

**Response:**
```json
{
  "comparison": [
    {
      "brand": "3M",
      "part_number": "2091",
      "size": null,
      "prices_by_supplier": "Amazon.ca:$19.99 | ULINE:$22.50 | Brogan Safety:N/A",
      "min_price": 19.99,
      "max_price": 22.50,
      "avg_price": 21.25,
      "suppliers_with_price": 2
    }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": "Brand and part number are required"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "resetTime": 1642248600000
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "sessionId": "uuid-session-id",
  "duration": 1500
}
```

## Usage Examples

### JavaScript/Fetch
```javascript
// Fetch prices for a product
const response = await fetch('/api/fetch-prices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    brand: '3M',
    partNumber: '2091',
    size: 'Medium'
  })
});

const data = await response.json();
console.log(data.prices);
```

### cURL
```bash
# Health check
curl -X GET http://localhost:3000/api/health

# Fetch prices
curl -X POST http://localhost:3000/api/fetch-prices \
  -H "Content-Type: application/json" \
  -d '{"brand":"3M","partNumber":"2091","size":"Medium"}'

# Get all products
curl -X GET http://localhost:3000/api/products
```

### Python
```python
import requests

# Fetch prices
response = requests.post('http://localhost:3000/api/fetch-prices', 
  json={
    'brand': '3M',
    'partNumber': '2091',
    'size': 'Medium'
  }
)

data = response.json()
print(data['prices'])
```

## Rate Limiting Best Practices

1. **Implement exponential backoff** when receiving 429 responses
2. **Cache responses** when possible to reduce API calls
3. **Batch requests** for multiple products with delays
4. **Monitor rate limit headers** to avoid hitting limits

## Webhooks (Future Feature)

Future versions may include webhook support for:
- Price change notifications
- Scraping completion events
- Error alerts

## SDK (Future Feature)

Official SDKs may be provided for:
- JavaScript/TypeScript
- Python
- PHP
- C#

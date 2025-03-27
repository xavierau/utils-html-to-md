# HTML to Markdown Express API Setup

This document provides instructions for setting up and using the HTML to Markdown conversion API.

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

## Installation

1. **Create a new directory for your project:**
   ```bash
   mkdir html-to-md-api
   cd html-to-md-api
   ```

2. **Initialize a new Node.js project:**
   ```bash
   npm init -y
   ```

3. **Install the required dependencies:**
   ```bash
   npm install express body-parser turndown cors sanitize-html helmet express-rate-limit
   ```

4. **Copy the API code into a file named `app.js`**

5. **Create a `.env` file to customize settings:**
   ```
   PORT=3000
   ALLOWED_ORIGINS=http://yourtrustedsite.com,http://localhost:8080
   NODE_ENV=production
   ```

## Running the Service

Start the service with:

```bash
node app.js
```

The service will run on port 3000 by default (or the port specified in your .env file).

## Security Features

The API includes several security measures:

1. **HTML Sanitization**: Removes potentially dangerous HTML elements and attributes using sanitize-html.
2. **Helmet Security Headers**: Adds important security headers to HTTP responses.
3. **Rate Limiting**: Prevents abuse by limiting request frequency from each IP address.
4. **CORS Protection**: Restricts which domains can access the API.
5. **Content Size Limits**: Prevents oversized payloads.

## API Usage

### Health Check

**Request:**
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Service is running"
}
```

### Convert HTML to Markdown

**Request:**
```
POST /api/convert
Content-Type: application/json

{
  "html": "<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>"
}
```

**Response:**
```json
{
  "success": true,
  "markdown": "# Hello World\n\nThis is a **test**."
}
```

## Example Usage with cURL

```bash
curl -X POST \
  http://localhost:3000/api/convert \
  -H 'Content-Type: application/json' \
  -d '{
    "html": "<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>"
  }'
```

## Example Usage with JavaScript Fetch

```javascript
fetch('http://localhost:3000/api/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: "<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>"
  }),
})
.then(response => response.json())
.then(data => console.log(data.markdown))
.catch(error => console.error('Error:', error));
```

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Successful conversion
- 400: Missing HTML content
- 500: Server or conversion error
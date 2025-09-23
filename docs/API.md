# Bob API Documentation

## Overview

Bob's API provides RESTful endpoints for chat management, user preferences, AI model integration, and system monitoring. All API routes are located in `/app/api/` and follow Next.js 15 App Router conventions.

## Authentication

Bob supports two authentication modes:

### Anonymous Users
- Automatically created on first visit
- Session stored in localStorage
- Subject to daily rate limits
- Can upgrade to authenticated account

### Authenticated Users
- Google OAuth via Supabase Auth
- JWT token-based authentication
- Higher rate limits
- Persistent data across devices

## Core API Endpoints

### Chat Operations

#### Create Chat
```http
POST /api/create-chat
Content-Type: application/json

{
  "projectId": "string (optional)",
  "initialMessage": "string (optional)"
}

Response:
{
  "chatId": "uuid",
  "createdAt": "timestamp",
  "model": "string"
}
```

#### Stream Chat Messages
```http
POST /api/chat
Content-Type: application/json

{
  "chatId": "uuid",
  "messages": [
    {
      "role": "user" | "assistant" | "system",
      "content": "string",
      "files": ["base64"] // optional
    }
  ],
  "model": "string",
  "userKey": "string (optional for BYOK)",
  "temperature": 0.7,
  "maxTokens": 4096
}

Response: Server-Sent Events stream
```

#### List Chats
```http
GET /api/chats?userId={userId}&projectId={projectId}

Response:
{
  "chats": [
    {
      "id": "uuid",
      "title": "string",
      "model": "string",
      "lastMessageAt": "timestamp",
      "isPinned": boolean,
      "projectId": "uuid"
    }
  ]
}
```

#### Update Chat Model
```http
POST /api/update-chat-model
Content-Type: application/json

{
  "chatId": "uuid",
  "model": "string"
}

Response:
{
  "success": true,
  "model": "string"
}
```

#### Toggle Chat Pin
```http
POST /api/toggle-chat-pin
Content-Type: application/json

{
  "chatId": "uuid",
  "isPinned": boolean
}
```

### User Management

#### Create Guest User
```http
POST /api/create-guest
Content-Type: application/json

{
  "userId": "string"
}

Response:
{
  "userId": "string",
  "createdAt": "timestamp",
  "anonymous": true
}
```

#### Get User Preferences
```http
GET /api/user-preferences?userId={userId}

Response:
{
  "theme": "light" | "dark" | "system",
  "fontSize": 14,
  "favoriteModels": ["model-id"],
  "systemPrompt": "string",
  "enableAnimations": boolean
}
```

#### Update User Preferences
```http
POST /api/user-preferences
Content-Type: application/json

{
  "userId": "string",
  "preferences": {
    "theme": "light" | "dark" | "system",
    "fontSize": 14,
    "systemPrompt": "string"
  }
}
```

#### Manage User API Keys (BYOK)
```http
POST /api/user-keys
Content-Type: application/json

{
  "provider": "openai" | "anthropic" | "google",
  "encryptedKey": "string"
}

GET /api/user-keys?userId={userId}

Response:
{
  "keys": {
    "openai": "encrypted-string",
    "anthropic": "encrypted-string"
  }
}
```

#### Check API Key Status
```http
GET /api/user-key-status?provider={provider}

Response:
{
  "valid": boolean,
  "error": "string (optional)"
}
```

### Project Management

#### List Projects
```http
GET /api/projects?userId={userId}

Response:
{
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "createdAt": "timestamp",
      "chatCount": number
    }
  ]
}
```

#### Get Project Details
```http
GET /api/projects/{projectId}

Response:
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "chats": [...],
  "settings": {}
}
```

### Messages

#### Get Chat Messages
```http
GET /api/messages?chatId={chatId}&limit={limit}&offset={offset}

Response:
{
  "messages": [
    {
      "id": "uuid",
      "role": "user" | "assistant",
      "content": "string",
      "createdAt": "timestamp",
      "files": []
    }
  ],
  "total": number
}
```

### System & Monitoring

#### Health Check
```http
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "ISO-8601",
  "version": "0.1.0"
}
```

#### Get CSRF Token
```http
GET /api/csrf

Response:
{
  "token": "string"
}
```

#### Check Rate Limits
```http
GET /api/rate-limits?userId={userId}&isAuthenticated={boolean}

Response:
{
  "dailyLimit": 100,
  "dailyUsage": 45,
  "remaining": 55,
  "resetsAt": "timestamp"
}
```

#### Get Usage Statistics
```http
GET /api/monitoring/usage?userId={userId}&period={day|week|month}

Response:
{
  "totalMessages": number,
  "totalTokens": number,
  "modelUsage": {
    "gpt-4": 1000,
    "claude-3": 500
  },
  "dailyStats": [...]
}
```

#### Get Model Usage
```http
GET /api/monitoring/models

Response:
{
  "models": [
    {
      "model": "gpt-4",
      "requests": 100,
      "tokens": 50000,
      "cost": 1.50
    }
  ]
}
```

### Provider Information

#### List Available Providers
```http
GET /api/providers

Response:
{
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "models": ["gpt-4", "gpt-3.5-turbo"],
      "requiresKey": true
    }
  ]
}
```

#### List Available Models
```http
GET /api/models?provider={provider}

Response:
{
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "contextWindow": 128000,
      "vision": true,
      "tools": true
    }
  ]
}
```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional information
}
```

### Common Error Codes
- `UNAUTHORIZED` - Authentication required
- `RATE_LIMIT_EXCEEDED` - Daily limit reached
- `INVALID_REQUEST` - Malformed request body
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error

## Rate Limiting

### Limits by User Type
- **Anonymous Users**: 50 requests/day
- **Authenticated Users**: 500 requests/day
- **Pro Users**: Unlimited (future)

### Headers
```http
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

## Security

### CSRF Protection
All state-changing operations require a CSRF token:
```http
X-CSRF-Token: {token-from-/api/csrf}
```

### API Key Encryption
User API keys are encrypted using AES-256-GCM before storage.

### Content Security
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- XSS prevention through content sanitization

## WebSocket Support (Future)

Planned WebSocket support for:
- Real-time chat streaming
- Collaborative editing
- Live usage monitoring

## SDK Usage Examples

### JavaScript/TypeScript
```typescript
// Create chat
const response = await fetch('/api/create-chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ projectId })
});

// Stream chat messages
const eventSource = new EventSource('/api/chat');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Python
```python
import requests

# Get user preferences
response = requests.get(
    'https://bob.newth.ai/api/user-preferences',
    params={'userId': user_id}
)
preferences = response.json()
```

## Versioning

The API uses URL versioning (planned for v2):
- Current: `/api/{endpoint}`
- Future: `/api/v2/{endpoint}`

## Support

For API support and questions:
- GitHub Issues: [github.com/n3wth/bob](https://github.com/n3wth/bob/issues)
- Documentation: [bob.newth.ai/docs](https://bob.newth.ai/docs)
# API Versioning Strategy

This document outlines the API versioning approach for the Water Tank Cleaning Service API.

## Versioning Strategy

We use **URL path versioning** for clear, explicit version management:
```
/v1/auth/login
/v2/auth/login
```

## When to Version

**Create new version when:**
- Breaking changes to request/response format
- Removing endpoints or parameters
- Changing authentication method
- Significant logic changes

**Don't version for:**
- Bug fixes
- Adding optional fields
- Adding new endpoints (use same version)
- Performance improvements

## Implementation Guide

### Current Version Structure

```
/v1/
  /auth/
  /booking/
  /tank/
  /admin/
  /review/
  /upload/
```

### Adding a New Version

#### 1. Create New Route Files

```javascript
// src/routes/v2/auth.js
const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
    // New v2 logic
});

module.exports = router;
```

#### 2. Update Server.js

```javascript
// Server setup
app.use('/v1/auth', require('./src/routes/v1/auth'));
app.use('/v2/auth', require('./src/routes/v2/auth'));
```

#### 3. Version Middleware

```javascript
// src/middlewares/apiVersion.js
const apiVersion = (req, res, next) => {
    const version = req.baseUrl.split('/')[1];
    req.apiVersion = version;
    next();
};

app.use(apiVersion);
```

#### 4. Update Documentation

```javascript
// Swagger routes
const swaggerDocumentV1 = require('./src/docs/swagger-v1.json');
const swaggerDocumentV2 = require('./src/docs/swagger-v2.json');

app.use('/api-docs/v1', swaggerUi.serve, swaggerUi.setup(swaggerDocumentV1));
app.use('/api-docs/v2', swaggerUi.serve, swaggerUi.setup(swaggerDocumentV2));
```

## Backwards Compatibility

- Support previous version for at least 6 months
- Provide migration guide in changelog
- Send deprecation notices in response headers

Example:
```javascript
res.set('Deprecation', 'true');
res.set('Sunset', new Date(Date.now() + 180*24*60*60*1000).toUTCString());
res.set('Link', '</v2/endpoint>; rel="successor-version"');
```

## Response Versioning

### V1 Response Format

```json
{
  "user": {
    "id": "123",
    "name": "John",
    "email": "john@example.com"
  },
  "token": "jwt_token"
}
```

### V2 Response Format (Example)

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2026-04-02T10:00:00Z",
    "version": "2.0.0"
  }
}
```

## Error Response Versioning

### V1 Errors

```json
{
  "error": {
    "statusCode": 400,
    "message": "Invalid input"
  }
}
```

### V2 Errors

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid input",
    "details": []
  }
}
```

## Version Deprecation Timeline

1. **Stable**: New version works alongside previous version
2. **Maintenance** (3-6 months): Bug fixes only, no new features
3. **Sunset Notice** (1-3 months): Clear messaging to migrate
4. **Deprecated** (Final): Endpoints return 410 Gone status

## Client Migration Guide

### Step 1: Identify API Version
```bash
curl https://api.example.com/version
# Returns: {"version": "1.0.0"}
```

### Step 2: Update Endpoints
```javascript
// Before (V1)
const response = await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// After (V2)
const response = await fetch('/v2/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
```

### Step 3: Handle Response Changes
```javascript
// V2 response structure
const { data } = await response.json();
const user = data.user;
```

## Release Checklist

- [ ] Increment version number (semantic versioning)
- [ ] Update all route files to new version
- [ ] Create new Swagger documentation
- [ ] Write migration guide
- [ ] Update client libraries
- [ ] Test backward compatibility
- [ ] Deploy and monitor
- [ ] Notify users of changes
- [ ] Set deprecation timeline

## Example Changelog

```markdown
## [2.0.0] - 2026-04-15

### Added
- New unified response format
- Request tracking with trace IDs
- Enhanced error messages

### Changed
- Response wrapper structure
- Error response format
- Updated all endpoints

### Deprecated
- V1 endpoints will be sunset on 2026-07-15

### Migration
See MIGRATION_V1_TO_V2.md
```

---

**Best Practice**: Keep version numbers in sync with semantic versioning
(MAJOR.MINOR.PATCH)

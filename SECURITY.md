# Security Best Practices

Comprehensive security guidelines for the Water Tank Cleaning Service API.

## ✅ Implemented Security Measures

### Authentication & Authorization
- [x] JWT token-based authentication
- [x] Role-based access control (RBAC)
- [x] Password hashing with bcryptjs
- [x] Token expiration
- [x] Refresh token mechanism

### Transport Security
- [x] Helmet.js for secure HTTP headers
- [x] CORS with origin validation
- [x] Rate limiting per endpoint
- [x] Request size limits

### Data Protection
- [x] Input validation with Joi
- [x] NoSQL injection prevention
- [x] XSS protection via sanitization
- [x] Password field exclusion from queries
- [x] CSRF middleware ready

### Infrastructure
- [x] Graceful shutdown handling
- [x] Error handling without info leakage
- [x] Audit logging
- [x] Database connection pooling
- [x] Non-root Docker execution

## 🔒 Additional Security Recommendations

### 1. API Key Authentication

For M2M (machine-to-machine) communication:

```javascript
// src/middlewares/apiKeyAuth.js
const apiKeyAuth = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return next(new ApiError(401, 'API Key required'));
    }
    
    const client = await ApiClient.findOne({ key: apiKey, active: true });
    if (!client) {
        return next(new ApiError(401, 'Invalid API Key'));
    }
    
    req.client = client;
    next();
};

module.exports = apiKeyAuth;
```

### 2. Request Signing

For critical operations, implement HMAC-SHA256 signing:

```javascript
// src/utils/requestSigning.js
const crypto = require('crypto');

const signRequest = (data, secret) => {
    return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(data))
        .digest('hex');
};

const verifySignature = (data, signature, secret) => {
    const expected = signRequest(data, secret);
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
    );
};

module.exports = { signRequest, verifySignature };
```

### 3. Two-Factor Authentication (2FA)

```javascript
// src/models/TwoFactorAuth.js
const twoFactorSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    secret: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    backupCodes: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
});
```

### 4. Rate Limiting Per User

```javascript
// src/middlewares/userRateLimit.js
const redis = require('redis');
const RedisStore = require('rate-limit-redis');

const userLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rate-limit:',
    }),
    keyGenerator: (req) => req.user ? req.user._id : req.ip,
    windowMs: 15 * 60 * 1000,
    max: 100,
});

module.exports = userLimiter;
```

### 5. Content Security Policy

```javascript
// In server.js helmet configuration
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
    },
}));
```

### 6. SQL/NoSQL Injection Prevention

```javascript
// Already using mongoose which prevents injection
// Additional layer: input validation
const { sanitizeQuery } = require('../services/sanitizationService');

app.use((req, res, next) => {
    req.query = sanitizeQuery(req.query);
    req.body = sanitizeObject(req.body);
    next();
});
```

### 7. Dependency Vulnerability Scanning

```bash
# Regular dependency audits
npm audit

# Automated scanning in CI/CD
npm audit --production --json

# Update vulnerable packages
npm update

# Use npm ci for deterministic builds
npm ci
```

### 8. Environment Variable Protection

```
Never commit .env files
Never log sensitive values
Use separate env files per environment
Rotate secrets regularly
Use external secret management (AWS Secrets Manager, Vault)
```

### 9. Database Security

**MongoDB Atlas Configuration:**
```javascript
// Connection string best practices
// mongodb+srv://user:pass@cluster.mongodb.net/dbname?
//   retryWrites=true&
//   w=majority&
//   tlsAllowInvalidCertificates=false&
//   minPoolSize=5&
//   maxPoolSize=10
```

**Recommendations:**
- [ ] Enable authentication
- [ ] Use strong passwords
- [ ] Restrict network access
- [ ] Enable encryption at rest
- [ ] Regular backups
- [ ] Enable audit logging

### 10. Session Management

```javascript
// src/config/session.js - For future implementation
const session = require('express-session');
const RedisStore = require('connect-redis').default;

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Requires HTTPS
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
    },
}));
```

### 11. File Upload Security

```javascript
// src/middlewares/fileUpload.js
const multer = require('multer');

const fileFilter = (req, file, cb) => {
    // Whitelist allowed MIME types
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'));
    }
};

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter,
});

// Scan uploaded files for malware (optional)
// const NodeClam = require('clamscan');
```

### 12. Logging & Monitoring

```javascript
// Sensitive data filtering
const filterSensitive = (obj) => {
    const sensitive = ['password', 'token', 'secret', 'key'];
    const filtered = { ...obj };
    
    sensitive.forEach(field => {
        if (filtered[field]) {
            filtered[field] = '***REDACTED***';
        }
    });
    
    return filtered;
};

logger.info('User login', filterSensitive(req.body));
```

## 🔐 Security Checklist

**Before Going Live:**
- [ ] All endpoints authenticated and authorized
- [ ] TLS/SSL certificates installed
- [ ] Database backed up and tested
- [ ] Secrets stored in secure vault
- [ ] Rate limiting tested and tuned
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive info
- [ ] Audit logging enabled
- [ ] Security headers verified
- [ ] Dependencies audited

**Ongoing Maintenance:**
- [ ] Weekly dependency updates check
- [ ] Monthly security audit
- [ ] Quarterly penetration testing
- [ ] Annual full security review
- [ ] Regular backup restoration tests
- [ ] Monitor for CVEs

## 🚨 Incident Response

**If Security Incident Occurs:**

1. **Immediate Actions**
   - Isolate affected systems
   - Collect evidence and logs
   - Notify stakeholders
   - Activate incident response team

2. **Investigation**
   - Determine scope of breach
   - Identify compromised data
   - Assess business impact

3. **Containment**
   - Patch vulnerabilities
   - Rotate credentials
   - Update security rules

4. **Recovery**
   - Restore from clean backups
   - Deploy hotfixes
   - Verify system integrity

5. **Communication**
   - Notify affected users
   - Provide guidance
   - Public disclosure if needed

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security-checklist/)

---

**Last Updated**: April 2026
**Review Schedule**: Quarterly

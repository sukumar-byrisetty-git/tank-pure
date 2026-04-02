# Water Tank Cleaning Service API

A production-ready Node.js/Express backend API for a water tank cleaning service platform. Built with security, scalability, and maintainability in mind.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Security**: Helmet, CORS, rate limiting, input sanitization, MongoDB injection prevention
- **Database**: MongoDB with connection pooling and health checks
- **Caching**: Redis integration for performance optimization
- **Async Processing**: Bull queues for notifications, emails, and reports
- **Logging**: Structured logging with Winston and file rotation
- **Testing**: Jest unit and integration tests with coverage reporting
- **Deployment**: Docker, PM2, and CI/CD with GitHub Actions
- **API Documentation**: Swagger/OpenAPI docs
- **Monitoring**: Health checks and error tracking ready

## 📋 Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+
- npm or yarn

## 🛠️ Setup & Development

### 1. Installation

```bash
# Clone repository
git clone <repository-url>
cd water-tank-api

# Install dependencies
npm install

# Setup Husky hooks
npm run prepare
```

### 2. Environment Configuration

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
- `MONGO_URI` - MongoDB connection string
- `REDIS_HOST` - Redis hostname
- `REDIS_PORT` - Redis port
- `JWT_SECRET` - JWT secret key
- `AWS_*` - AWS credentials for S3
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Firebase service account

### 3. Local Development

#### Using Docker Compose (Recommended)

```bash
# Start all services (API, MongoDB, Redis)
docker-compose up

# API runs on http://localhost:4000
# Mongo on localhost:27017
# Redis on localhost:6379
```

#### Using Native Services

```bash
# Start MongoDB
mongod

# Start Redis
redis-server

# Start API in development mode
npm run dev

# Runs with hot-reload via nodemon
# API available at http://localhost:4000
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Coverage Threshold**: 60% (branches, functions, lines, statements)

## 📝 Linting & Code Quality

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Pre-commit hooks automatically run linting
```

## 📚 API Documentation

### Swagger UI
- Development: http://localhost:4000/api-docs
- Production: https://your-domain.com/api-docs

### Key Endpoints

#### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh-token` - Refresh JWT
- `POST /auth/change-password` - Change password
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

#### Booking
- `GET /booking` - List bookings
- `POST /booking` - Create booking
- `GET /booking/:id` - Get booking details
- `PUT /booking/:id` - Update booking
- `DELETE /booking/:id` - Cancel booking

#### Tanks
- `GET /tank` - List tanks
- `POST /tank` - Add tank (admin)
- `PUT /tank/:id` - Update tank (admin)
- `DELETE /tank/:id` - Delete tank (admin)

#### Reviews
- `POST /review` - Create review
- `GET /review/:bookingId` - Get review

#### Admin
- `GET /admin/users` - List users
- `GET /admin/bookings` - Booking analytics
- `GET /admin/stats` - System statistics

#### System
- `GET /health` - Health check with database status

## 🚢 Production Deployment

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start with ecosystem config
npm run start:prod

# Monitor processes
pm2 monit

# View logs
pm2 logs water-tank-api
```

### Using Docker & Kubernetes

```bash
# Build Docker image
docker build -t water-tank-api:latest .

# Run container
docker run -p 4000:4000 --env-file .env.production water-tank-api:latest

# Or with docker-compose for production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment-Specific Configs

Three configurations available:
- **Development**: Debug enabled, looser limits, cache disabled
- **Staging**: Production-like, caching enabled, medium rate limits
- **Production**: Strict security, aggressive caching, low rate limits

Set via `NODE_ENV` environment variable.

## 📊 Monitoring & Logging

### Log Files
```
logs/
├── combined.log        # All logs
├── error.log          # Errors only
└── application-*.log  # Daily rotated logs (production)
```

### Health Check
```bash
curl http://localhost:4000/health

# Response:
{
    "status": "ok",
    "version": "1.0.0",
    "environment": "production",
    "database": {
        "status": "connected",
        "message": "Database is healthy"
    },
    "timestamp": "2026-04-02T10:30:00Z"
}
```

### Error Monitoring
Optional Sentry integration for error tracking:
```bash
export SENTRY_DSN=https://your-sentry-dsn
```

## 🔒 Security Best Practices

✅ **Implemented:**
- Helmet for HTTP headers
- CORS with origin validation
- Rate limiting per endpoint
- Input sanitization and validation
- MongoDB injection prevention
- Password hashing with bcryptjs
- JWT token expiration
- Graceful shutdown on signals
- Non-root Docker user
- Database connection pooling

✅ **Recommended Additional Steps:**
- Enable HTTPS/TLS in production
- Use environment-specific JWT secrets
- Implement API key authentication for M2M
- Set up Web Application Firewall (WAF)
- Enable database-level encryption
- Regular security audits and dependency updates

## 🔄 CI/CD Pipeline

GitHub Actions workflow with:
- Linting (ESLint)
- Unit & integration tests
- Code coverage reporting
- Security scanning (npm audit)
- Docker image building & pushing
- Production deployment (manual approval)

Trigger events:
- Push to `main` or `develop` branches
- Pull requests

## 📦 Queue System

Async tasks handled by Bull + Redis:

### Notification Queue
```javascript
await queueService.addNotification(userId, notificationData);
```

### Email Queue
```javascript
await queueService.addEmail(email, subject, template, data);
```

### Report Queue
```javascript
await queueService.addReport(userId, reportType, filters);
```

## 🗄️ Database Schema

- **Users** - User accounts with roles
- **Bookings** - Service bookings with status tracking
- **Tanks** - Tank inventory management
- **Reviews** - Customer feedback
- **Notifications** - User notifications

See `src/models/` for detailed schema definitions.

## 🆘 Troubleshooting

### MongoDB Connection Issues
```bash
# Check connection string format
# Ensure credentials are URL-encoded
# Verify network access rules

# Connection with retries enabled (auto-retry up to 5 times with exponential backoff)
```

### Redis Connection Issues
```bash
# Gracefully handles Redis unavailability
# Falls back to non-cached mode in development
# Create `.env.local` for local Redis settings
```

### Test Failures
```bash
# Ensure MongoDB is running for tests
# Clear test database: db.dropDatabase()
# Check jest.setup.js for test configuration
```

## 📈 Performance Optimization

- Database connection pooling (max: 10, min: 5)
- Redis caching with TTL configuration
- Gzip compression for responses
- Request body size limits (10MB)
- Efficient database indexing
- Async queue processing

## 📞 Support & Contributing

For issues, suggestions, or contributions:
1. Create an issue with detailed information
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

## 📄 License

[Your License Here]

---

**Last Updated**: April 2026
**Status**: Production Ready ✅

// Jest setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGO_URI = 'mongodb://localhost:27017/water-tank-test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = 6379;
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{"type":"service_account","project_id":"test","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDU8W/b7EJd\nT8RkJv3Ydw==\n-----END PRIVATE KEY-----","client_email":"test@test.iam.gserviceaccount.com"}';

// Suppress console output during tests
global.console.log = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();

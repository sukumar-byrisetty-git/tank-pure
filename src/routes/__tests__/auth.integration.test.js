const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const ROLES = require('../../constants/roles');
const bcrypt = require('bcryptjs');

// Note: This is a template. Ensure server can be imported as app
// You may need to refactor server.js to export app separately for testing

describe('API Integration Tests - Auth Endpoints', () => {
    jest.setTimeout(60000);
    let app;
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@12345',
    };

    beforeAll(async () => {
        // Connect to test database
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI must be set in environment for integration tests');
        }

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        }

        app = require('../../../server');
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.disconnect();
    });

    beforeEach(async () => {
        await User.deleteMany({});
        // Initialize express app for testing
        // app = require('../../../server');
    });

    describe('POST /auth/signup', () => {
        it('should create a new user with valid data', async () => {
            const response = await request(app)
                .post('/auth/signup')
                .send(testUser);

            expect(response.status).toBe(201);
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.email).toBe(testUser.email);
            expect(response.body.user.role).toBe(ROLES.CUSTOMER);
            expect(response.body).toHaveProperty('token');
        });

        it('should reject existing email', async () => {
            // Create first user
            await User.create({
                name: testUser.name,
                email: testUser.email,
                password: await bcrypt.hash(testUser.password, 10),
                role: ROLES.CUSTOMER,
            });

            // Try to create duplicate
            const response = await request(app)
                .post('/auth/signup')
                .send(testUser);

            expect(response.status).toBe(409);
            expect(response.body.error.message).toContain('already registered');
        });

        it('should reject weak password', async () => {
            const response = await request(app)
                .post('/auth/signup')
                .send({
                    ...testUser,
                    password: 'weak',
                });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('password');
        });

        it('should reject invalid email', async () => {
            const response = await request(app)
                .post('/auth/signup')
                .send({
                    ...testUser,
                    email: 'not-an-email',
                });

            expect(response.status).toBe(400);
        });

        it('should reject superadmin signup', async () => {
            const response = await request(app)
                .post('/auth/signup')
                .send({
                    ...testUser,
                    role: ROLES.SUPERADMIN,
                });

            expect(response.status).toBe(403);
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            // Create a test user
            const hashedPassword = await bcrypt.hash(testUser.password, 10);
            await User.create({
                name: testUser.name,
                email: testUser.email,
                password: hashedPassword,
                role: ROLES.CUSTOMER,
            });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            expect(response.status).toBe(200);
            expect(response.body.user).toHaveProperty('id');
            expect(response.body).toHaveProperty('token');
        });

        it('should reject invalid password', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
            expect(response.body.error.message).toContain('credentials');
        });

        it('should reject non-existent user', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: testUser.password,
                });

            expect(response.status).toBe(401);
        });
    });

    describe('Token and password flows', () => {
        it('should refresh access token with refresh token', async () => {
            const signupResp = await request(app).post('/auth/signup').send(testUser);
            expect(signupResp.status).toBe(201);

            const refreshResp = await request(app).post('/auth/refresh').send({ token: signupResp.body.token.refreshToken });
            expect(refreshResp.status).toBe(200);
            expect(refreshResp.body).toHaveProperty('accessToken');
            expect(refreshResp.body).toHaveProperty('refreshToken');
        });

        it('should logout and invalidate refresh token', async () => {
            const signupResp = await request(app).post('/auth/signup').send(testUser);
            expect(signupResp.status).toBe(201);

            const logoutResp = await request(app)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${signupResp.body.token.accessToken}`)
                .send({ token: signupResp.body.token.refreshToken });

            expect(logoutResp.status).toBe(200);

            await request(app).post('/auth/refresh').send({ token: signupResp.body.token.refreshToken }).expect(401);
        });

        it('should allow forgot password and reset', async () => {
            await User.create({
                name: testUser.name,
                email: testUser.email,
                password: await bcrypt.hash(testUser.password, 10),
                role: ROLES.CUSTOMER,
            });

            const forgotResp = await request(app).post('/auth/forgot-password').send({ email: testUser.email });
            expect(forgotResp.status).toBe(200);
            expect(forgotResp.body).toHaveProperty('resetToken');

            const resetResp = await request(app).post('/auth/reset-password').send({
                token: forgotResp.body.resetToken,
                newPassword: 'NewPass@1234',
                confirmPassword: 'NewPass@1234',
            });
            expect(resetResp.status).toBe(200);

            const loginResp = await request(app).post('/auth/login').send({
                email: testUser.email,
                password: 'NewPass@1234',
            });
            expect(loginResp.status).toBe(200);
        });
    });

    describe('Health Check', () => {
        it('should return system health status', async () => {
            const response = await request(app)
                .get('/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('database');
        });
    });
});

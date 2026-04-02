const mongoose = require('mongoose');
const User = require('./User');
const ROLES = require('../constants/roles');

describe('User Model', () => {
    jest.setTimeout(60000);

    beforeAll(async () => {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI must be set to run model tests');
        }
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    describe('User Creation', () => {
        it('should create a user with valid data', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123',
                role: ROLES.CUSTOMER,
            };

            const user = await User.create(userData);

            expect(user._id).toBeDefined();
            expect(user.name).toBe(userData.name);
            expect(user.email).toBe(userData.email);
            expect(user.role).toBe(ROLES.CUSTOMER);
            expect(user.timestamps).toBeDefined();
        });

        it('should reject duplicate email', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123',
            };

            await User.create(userData);

            await expect(
                User.create(userData)
            ).rejects.toThrow();
        });

        it('should require name and email', async () => {
            const userData = {
                password: 'hashedPassword123',
            };

            await expect(
                User.create(userData)
            ).rejects.toThrow();
        });
    });

    describe('User Validation', () => {
        it('should validate user role enum', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123',
                role: 'invalid_role',
            };

            await expect(
                User.create(userData)
            ).rejects.toThrow();
        });

        it('should set default role to CUSTOMER', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123',
            };

            const user = await User.create(userData);

            expect(user.role).toBe(ROLES.CUSTOMER);
        });
    });

    describe('Password Field', () => {
        it('should not return password by default', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123',
            };

            await User.create(userData);

            const user = await User.findOne({ email: userData.email });
            expect(user.password).toBeUndefined();
        });

        it('should return password with select', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123',
            };

            await User.create(userData);

            const user = await User.findOne({ email: userData.email }).select('+password');
            expect(user.password).toBe('hashedPassword123');
        });
    });
});

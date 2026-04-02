require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../src/config/logger');
const User = require('../src/models/User');
const Tank = require('../src/models/Tank');
const ROLES = require('../src/constants/roles');

const seedDatabase = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/water-tank';
        await mongoose.connect(MONGO_URI);
        logger.info('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Tank.deleteMany({});
        logger.info('Cleared existing data');

        // Create superadmin
        const hashedPassword = await bcrypt.hash('Admin@123456', 10);
        const superadmin = await User.create({
            name: 'Super Admin',
            email: 'admin@example.com',
            password: hashedPassword,
            role: ROLES.SUPERADMIN,
            address: 'Admin Office',
        });
        logger.info(`Created superadmin: ${superadmin.email}`);

        // Create admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin-user@example.com',
            password: hashedPassword,
            role: ROLES.ADMIN,
            address: 'Main Office',
        });
        logger.info(`Created admin: ${admin.email}`);

        // Create workers
        for (let i = 1; i <= 3; i++) {
            const worker = await User.create({
                name: `Worker ${i}`,
                email: `worker${i}@example.com`,
                password: hashedPassword,
                role: ROLES.WORKER,
                address: `Worker Address ${i}`,
            });
            logger.info(`Created worker: ${worker.email}`);
        }

        // Create regular customers
        for (let i = 1; i <= 5; i++) {
            const customer = await User.create({
                name: `Customer ${i}`,
                email: `customer${i}@example.com`,
                password: hashedPassword,
                role: ROLES.CUSTOMER,
                address: `Customer Address ${i}`,
            });
            logger.info(`Created customer: ${customer.email}`);
        }

        // Create sample tanks (if Tank model exists)
        try {
            for (let i = 1; i <= 5; i++) {
                await Tank.create({
                    name: `Tank ${i}`,
                    capacity: 1000 * i,
                    location: `Location ${i}`,
                    type: i % 2 === 0 ? 'underground' : 'overhead',
                    status: 'active',
                });
                logger.info(`Created tank: Tank ${i}`);
            }
        } catch (err) {
            logger.warn('Tank seeding skipped (model may not be configured):', err.message);
        }

        logger.info('✅ Database seeding completed successfully');
        process.exit(0);
    } catch (err) {
        logger.error('Database seeding failed:', err);
        process.exit(1);
    }
};

seedDatabase();

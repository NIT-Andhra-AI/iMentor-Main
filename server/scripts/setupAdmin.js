const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');
const log = require('../utils/logger');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function createNewAdmin() {
    log.info('SYSTEM', 'Starting admin creation process...');

    const email = await question('Enter new admin email: ');
    const password = await question('Enter new admin password (min 6 characters): ');
    const username = await question('Enter new admin username: ');

    if (!email || !password || !username || password.length < 6) {
        throw new Error('Invalid input. Email, username, and a password of at least 6 characters are required.');
    }

    const newAdmin = new User({
        email,
        password,
        username,
        isAdmin: true,
        hasCompletedOnboarding: true,
        apiKeyRequestStatus: 'approved',
    });

    await newAdmin.save();
    log.success('SYSTEM', `Admin user '${email}' created`);
}

async function modifyExistingAdmin(adminUser) {
    log.info('SYSTEM', `Modifying admin: ${adminUser.email}`);

    const newEmail = await question(`Enter new email (or press Enter to keep '${adminUser.email}'): `);
    if (newEmail.trim()) adminUser.email = newEmail.trim();

    const newUsername = await question(`Enter new username (or press Enter to keep '${adminUser.username}'): `);
    if (newUsername.trim()) adminUser.username = newUsername.trim();

    const newPassword = await question('Enter new password (or press Enter to keep unchanged): ');
    if (newPassword.trim()) {
        if (newPassword.trim().length < 6) {
            throw new Error('New password must be at least 6 characters long.');
        }
        adminUser.password = newPassword.trim();
    }

    await adminUser.save();
    log.success('SYSTEM', `Admin user '${adminUser.email}' updated`);
}

async function setupAdmin(mongoUri) {
    if (!mongoUri) {
        log.error('SYSTEM', 'MONGO_URI not defined. Cannot proceed.');
        process.exit(1);
    }

    const adminEmail = process.env.FIXED_ADMIN_USERNAME || 'admin@admin.com';
    const adminPassword = process.env.FIXED_ADMIN_PASSWORD || 'admin123';

    try {
        await mongoose.connect(mongoUri);
        // log.info('SYSTEM', 'MongoDB connected for admin check');

        const stripResult = await User.updateMany(
            { email: { $ne: adminEmail }, isAdmin: true },
            { $set: { isAdmin: false } }
        );
        if (stripResult.modifiedCount > 0) {
            log.info('SYSTEM', `Removed admin privileges from ${stripResult.modifiedCount} users`);
        }

        let adminUser = await User.findOne({ email: adminEmail });

        if (!adminUser) {
            log.info('SYSTEM', `Creating fixed admin: ${adminEmail}...`);
            adminUser = new User({
                email: adminEmail,
                password: adminPassword,
                username: 'admin',
                isAdmin: true,
                hasCompletedOnboarding: true,
                apiKeyRequestStatus: 'approved',
            });
            await adminUser.save();
            log.success('SYSTEM', `Fixed admin created: ${adminEmail}`);
        } else {
            if (!adminUser.isAdmin) {
                adminUser.isAdmin = true;
                await adminUser.save();
                log.success('SYSTEM', `Admin privileges restored for ${adminEmail}`);
            }
        }

        // Ensure standard student test accounts exist
        const defaultStudents = [
            { email: 'student@imentor.edu', username: 'alex_ece', name: 'Alex Rivera', branch: 'ECE' },
            { email: 'eee.student@imentor.edu', username: 'priya_eee', name: 'Priya Sharma', branch: 'EEE' }
        ];

        for (const s of defaultStudents) {
            let st = await User.findOne({ email: s.email });
            if (!st) {
                st = new User({
                    email: s.email,
                    username: s.username,
                    password: 'password123',
                    name: s.name,
                    profile: { name: s.name, branch: s.branch, college: 'NIT Andhra Pradesh' },
                    emailVerified: true,
                    hasCompletedOnboarding: true
                });
                await st.save();
                log.success('SYSTEM', `Default student account created: ${s.email}`);
            }
        }

    } catch (error) {
        log.error('SYSTEM', 'Admin setup error', error);
    } finally {
        if (rl) rl.close();
    }
}

module.exports = { setupAdmin };
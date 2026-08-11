// server/scripts/createFacultyUser.js
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27018/imentor';

async function createFaculty() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully.");

        const email = 'faculty@imentor.edu';
        let user = await User.findOne({ email });

        if (user) {
            console.log(`Faculty user already exists with email: ${email}`);
            user.isFaculty = true;
            user.department = 'Computer Science';
            await user.save();
            console.log("Updated existing user to be a Faculty member in the 'Computer Science' department.");
        } else {
            user = new User({
                email,
                username: 'faculty_cs',
                password: 'password123',
                isFaculty: true,
                department: 'Computer Science',
                emailVerified: true,
                hasCompletedOnboarding: true
            });
            await user.save();
            console.log("Created new Faculty user:");
            console.log(`- Email: ${email}`);
            console.log("- Password: password123");
            console.log("- Department: Computer Science");
        }

        mongoose.connection.close();
    } catch (error) {
        console.error("Failed to create Faculty user:", error);
        process.exit(1);
    }
}

createFaculty();

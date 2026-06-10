const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ==========================================
// DEVELOPMENT UTILITY: DATABASE SEEDER
// ==========================================
// Note: This is a destructive route intended ONLY for development and testing environments.
// It resets the User collection and provisions default mock accounts.
router.get('/run', async (req, res) => {
    try {
        // Step 1: Purge existing user collection to establish a clean state
        await User.deleteMany({});

        // Step 2: Provision Root Administrator Account
        // Apply bcrypt hashing with 10 salt rounds for credential security
        const adminHash = await bcrypt.hash("admin123", 10);
        await User.create({
            name: 'Rajesh Kumar',
            email: 'admin@academia.ai',
            password: adminHash,
            role: 'admin',
            initials: 'RK'
        });

        // Step 3: Provision Mock Faculty Account
        const teacherHash = await bcrypt.hash("password123", 10);
        await User.create({
            name: 'Dr. Priya Sharma',
            email: 'teacher@academia.ai',
            password: teacherHash,
            role: 'faculty', // Maps directly to the RBAC faculty permissions
            initials: 'PS',
            department: 'Computer Science'
        });

        res.json({ message: "System Initialized: Default Admin and Faculty accounts have been provisioned successfully." });
    } catch (err) {
        console.error("Database Seeding Exception:", err.message);
        res.status(500).json({ error: "Failed to execute database seeding protocol." });
    }
});

module.exports = router;
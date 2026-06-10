const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ==========================================
// USER MANAGEMENT AND PROVISIONING 
// ==========================================

/**
 * Route: GET /all
 * Purpose: Retrieves the complete user registry for the frontend administrative dashboard.
 * Technical Note: Utilizes chronological sorting (descending) to ensure newly provisioned
 * accounts automatically render at the top of the client-side lists.
 */
router.get('/all', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }); 
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error during user retrieval.", error: err.message });
    }
});

/**
 * Route: POST /add
 * Purpose: Provisions a new user entity within the database.
 * Technical Note: Implements algorithmic string parsing to automatically generate user initials for the UI,
 * alongside a pseudo-random generator for the public-facing institutional identifier.
 */
router.post('/add', async (req, res) => {
    try {
        const { name, email, department, batch, role } = req.body;

        // String Manipulation: Parse the full name string to dynamically generate user initials (e.g., for UI avatars)
        const nameParts = name.split(' ');
        const initials = nameParts.length > 1 
            ? nameParts[0][0] + nameParts[1][0] 
            : nameParts[0][0];

        // Pseudo-random generation to assign a unique, localized display identifier
        const displayId = '#' + Math.floor(1000 + Math.random() * 9000);

        const newUser = new User({
            name,
            email,
            department,
            batch,
            role,
            initials: initials.toUpperCase(),
            id: displayId
        });

        // Data Persistence: Commit the new user entity to the MongoDB cluster
        await newUser.save();
        res.status(201).json({ message: "User account provisioned successfully.", user: newUser });
    } catch (err) {
        res.status(400).json({ message: "Failed to provision user account.", error: err.message });
    }
});

module.exports = router;
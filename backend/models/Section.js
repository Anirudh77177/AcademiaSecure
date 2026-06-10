const mongoose = require('mongoose');

/**
 * Section Schema
 * A foundational reference collection representing academic sections or student groups.
 * Utilized for organizing students and mapping them to specific course offerings.
 */
const sectionSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        // Enforces database-level uniqueness to prevent duplicate section names
        unique: true 
    }
});

// Prevent model overwrite errors during hot-reloading in development environments
module.exports = mongoose.models.Section || mongoose.model('Section', sectionSchema);
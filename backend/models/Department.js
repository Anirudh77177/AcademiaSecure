const mongoose = require('mongoose');

/**
 * Department Schema
 * A foundational reference collection used to manage academic departments within the institution.
 * Serves as a central lookup for categorizing users (faculty/students) and courses.
 */
const departmentSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        // Enforces uniqueness at the database level to prevent duplicate department entries
        unique: true 
    }
});

module.exports = mongoose.model('Department', departmentSchema);
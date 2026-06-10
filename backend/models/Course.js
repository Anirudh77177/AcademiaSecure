const mongoose = require('mongoose');

/**
 * Course Schema
 * Represents an academic course offering mapped to a specific section, 
 * an assigned faculty member, and a cohort of enrolled students.
 */
const courseSchema = new mongoose.Schema({
    courseCode: { 
        type: String, 
        required: true 
    }, 
    courseName: { 
        type: String, 
        required: true 
    },
    section: { 
        type: String, 
        required: true 
    }, 
    // Establishes a relationship with the Faculty member (references User collection)
    faculty: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    // Establishes a relationship tracking all enrolled Students (references User collection)
    students: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }], 
    semester: { 
        type: String, 
        default: 'Spring 2026' 
    },
    // Tracks the operational state of the course for dashboard analytics
    status: { 
        type: String, 
        enum: ['Active', 'Critical', 'Completed'], 
        default: 'Active' 
    },
    nextClass: { 
        type: String, 
        default: 'Not Scheduled' 
    },
    classTiming: { 
        type: String, 
        default: 'Not Scheduled' 
    }
}, { 
    timestamps: true 
});

// Prevent model overwrite errors during hot-reloading in development environments
module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);
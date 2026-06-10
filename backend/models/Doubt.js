const mongoose = require('mongoose');

/**
 * Doubt/Grievance Schema
 * Manages the two-way communication hub between students and faculty.
 * Tracks the lifecycle of an academic query from submission to resolution.
 */
const doubtSchema = new mongoose.Schema({
    // Reference to the student who raised the query
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Reference to the assigned faculty member handling the query
    facultyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    courseCode: { 
        type: String, 
        required: true 
    },
    question: { 
        type: String, 
        required: true 
    },
    // Stores the faculty's response; remains empty until resolved
    answer: { 
        type: String, 
        default: "" 
    }, 
    // State management for tracking the grievance lifecycle
    status: { 
        type: String, 
        enum: ['Pending', 'Resolved'], 
        default: 'Pending' 
    },
    // Notification flags to manage unread message alerts on dashboards
    isReadByStudent: { 
        type: Boolean, 
        default: false 
    },
    isReadByTeacher: { 
        type: Boolean, 
        default: false 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Doubt', doubtSchema);
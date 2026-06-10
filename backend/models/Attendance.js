const mongoose = require('mongoose');

/**
 * Attendance Schema
 * Manages daily attendance sessions mapped to specific courses and sections.
 */
const attendanceSchema = new mongoose.Schema({
    courseId: { 
        type: String, 
        required: true 
    },
    section: { 
        type: String, 
        default: '' // Defaults to empty string to accommodate global or multi-section attendance sessions
    },
    date: { 
        type: Date, 
        required: true 
    },
    markedBy: {
        type: String, // Maintained as a String instead of ObjectId to flexibly support varying roles (e.g., specific ID, "Faculty", or "Admin")
        required: true 
    },
    records: [{
        studentId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' // Establishes a relational reference to the User collection
        },
        name: String,
        status: { 
            type: String, 
            enum: ['Present', 'Absent', 'Late'], 
            required: true 
        }
    }]
}, { 
    timestamps: true // Automatically manages createdAt and updatedAt fields
});

module.exports = mongoose.model('Attendance', attendanceSchema);
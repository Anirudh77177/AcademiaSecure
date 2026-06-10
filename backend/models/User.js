const mongoose = require('mongoose');

/**
 * User Schema
 * The core identity model for the AcademiaAI system.
 * Manages authentication credentials, Role-Based Access Control (RBAC), and demographic tracking.
 */
const userSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true 
        },
        // Enforces data sanitization at the database level to prevent login mismatches
        email: { 
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true, 
            trim: true 
        },
        // Stores the securely hashed authentication key
        password: { 
            type: String, 
            required: true 
        }, 
        department: { 
            type: String 
        },
        batch: { 
            type: String 
        },
        section: { 
            type: String 
        }, 
        // Strict RBAC enforcement utilizing Mongoose enumerators
        role: { 
            type: String, 
            enum: ['admin', 'faculty', 'student'], 
            default: 'student' 
        },
        initials: { 
            type: String 
        },
        // Institutional System ID (e.g., assigned university Roll No. or Employee ID)
        // Kept distinct from the internal MongoDB _id for data integrity
        id: { 
            type: String, 
            unique: true 
        }, 
        // Ephemeral states for handling secure password resets and OTP verification workflows
        otp: { 
            type: String, 
            default: null 
        },
        otpExpires: { 
            type: Date, 
            default: null 
        }
    },
    { 
        timestamps: true 
    }
);

// Prevent model overwrite errors during hot-reloading in development environments
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
const express = require('express'); 
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); 
const bcrypt = require('bcryptjs'); 
const Department = require('./models/Department');
const User = require('./models/User');
const teacherRoutes = require('./routes/teacherRoutes');

// Initialize environment variables configuration
dotenv.config();

// Initialize Express application instance
const app = express();

// ==========================================
// GLOBAL MIDDLEWARE & CORS SECURITY SETUP
// ==========================================

const allowedOrigins = [
  'http://localhost:5173', // Vite local development port
  'http://localhost:3000'  // Standard alternate React port
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) return callback(null, true);
        
        // Dynamically allow deployment backend or local development systems
        if (allowedOrigins.indexOf(origin) !== -1 || origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        } else {
            const errorMsg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(errorMsg), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json()); // Parse incoming JSON payloads

// ==========================================
// APPLICATION BOOTSTRAP & SEEDING UTILITIES
// ==========================================

/**
 * Metadata Seeding Utility
 * Automatically populates essential academic departments on server startup 
 * if the collection is currently empty. Ensures base metadata integrity.
 */
const seedDepartments = async () => {
    try {
        const count = await Department.countDocuments();
        if (count === 0) {
            const defaultDepts = [
                { name: "Computer Science" },
                { name: "Artificial Intelligence" },
                { name: "Information Technology" },
                { name: "Data Science" },
                { name: "Electronics & Communication" }
            ];
            await Department.insertMany(defaultDepts);
            console.log("[SYSTEM] Default organizational metadata seeded successfully.");
        }
    } catch (err) {
        console.error("[SYSTEM ERROR] Department metadata seeding failed:", err);
    }
};

/**
 * Root Administrator Provisioning
 * Ensures a primary superuser account exists for system configuration 
 * and initial deployment access. Prevents system lockout on fresh deployments.
 */
const createRootAdmin = async () => {
    try {
        const adminEmail = "sanusinha814@gmail.com"; 
        const adminExists = await User.findOne({ email: adminEmail });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            await User.create({
                name: "Anirudh Kumar",
                email: adminEmail,
                password: hashedPassword,
                role: "admin", // Strict RBAC assignment
                id: "ADMIN-001"
            });
            console.log(`[SYSTEM] Root Administrator provisioned: ${adminEmail}`);
        } else {
            console.log("[SYSTEM] Root Administrator registry confirmed intact.");
        }
    } catch (err) {
        console.log("[SYSTEM ERROR] Root Administrator Provisioning Exception:", err.message);
    }
};

// ==========================================
// DATABASE CONNECTION & ROUTE MOUNTING
// ==========================================

// Establish asynchronous connection to the MongoDB cluster
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
      console.log("[DATABASE] MongoDB Connected: AcademiaAI Cluster");
      // Trigger bootstrap functions post-connection
      seedDepartments(); 
      createRootAdmin(); 
  })
  .catch((err) => console.log("[DATABASE] Connection Exception:", err));

// Modular Route Registration (Separation of Concerns)
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/insights', require('./routes/insightRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/teacher', teacherRoutes);

// ==========================================
// SERVER INITIALIZATION
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SERVER] Instance actively listening on port ${PORT}`);
});
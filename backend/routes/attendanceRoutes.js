const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');

/**
 * Utility Function: Returns the current date formatted as YYYY-MM-DD in IST timezone.
 * Essential for strict chronological validation of attendance records in India.
 */
const getTodayIST = () => {
    const date = new Date();
    date.setUTCHours(date.getUTCHours() + 5);
    date.setUTCMinutes(date.getUTCMinutes() + 30);
    return date.toISOString().split('T')[0];
};

/**
 * Utility Function: Returns yesterday's date formatted as YYYY-MM-DD in IST timezone.
 */
const getYesterdayIST = () => {
    const date = new Date();
    date.setUTCHours(date.getUTCHours() + 5);
    date.setUTCMinutes(date.getUTCMinutes() + 30);
    date.setDate(date.getDate() - 1); 
    return date.toISOString().split('T')[0];
};

// ==========================================
// POST: ATTENDANCE SYNCHRONIZATION
// ==========================================
router.post('/mark', async (req, res) => {
    try {
        const { courseId, section, date, records, userRole } = req.body;

        if (!courseId || !date || !records) {
            return res.status(400).json({ message: "Payload missing required fields" });
        }

        // ROLE-BASED DATE LOCK: 
        // Faculty privileges are strictly limited to logging attendance for the current day or the immediate previous day.
        const todayIST = getTodayIST();
        const yesterdayIST = getYesterdayIST();
        
        if (userRole === 'faculty' && date !== todayIST && date !== yesterdayIST) {
            return res.status(403).json({ 
                message: `Security Violation: Faculty access is restricted to today (${todayIST}) or yesterday (${yesterdayIST}).` 
            });
        }

        // Format the incoming roster payload to match the database schema
        const formattedRecords = records.map(student => ({
            studentId: student.studentId,
            name: student.name,
            status: student.status
        }));

        // Normalize the date object to midnight to ensure accurate query matching
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        // Retrieve existing session. Section filtering prevents data crossover between different cohorts of the same course.
        let existingRecord = await Attendance.findOne({ 
            courseId, 
            section: section || '', 
            date: checkDate 
        });

        // Upsert Logic: Update if the session exists, otherwise create a new telemetry record.
        if (existingRecord) {
            existingRecord.records = formattedRecords;
            existingRecord.markedBy = userRole === 'admin' ? 'Admin' : 'Faculty';
            await existingRecord.save();
            return res.json({ message: "Attendance session updated successfully." });
        } else {
            const newAttendance = new Attendance({
                courseId,
                section: section || '', 
                date: checkDate,
                records: formattedRecords,
                markedBy: userRole === 'admin' ? 'Admin' : 'Faculty'
            });
            await newAttendance.save();
            return res.status(201).json({ message: "New attendance session logged successfully." });
        }

    } catch (err) {
        res.status(500).json({ message: "Internal server error during attendance synchronization.", error: err.message });
    }
});

// ==========================================
// GET: RETRIEVE COURSE ROSTER (MULTI-SECTION SUPPORT)
// ==========================================
router.get('/students/:courseCode', async (req, res) => {
    try {
        // Query param 'section' accepts comma-separated values (e.g., "A,B") or "ALL"
        const { section } = req.query; 
        
        const course = await Course.findOne({ courseCode: req.params.courseCode })
                                   .populate('students', 'name id email section');
        
        if (!course) return res.status(404).json({ message: "Course record not found in registry." });

        let filteredStudents = course.students;

        // MULTI-SECTION LOGIC: 
        // If a specific section filter is applied, split the parameter and cross-reference against enrolled students.
        if (section && section !== 'ALL') {
            const sectionArray = section.split(','); 
            filteredStudents = course.students.filter(s => sectionArray.includes(s.section));
        }

        // Format the output payload for the frontend UI client
        const roster = filteredStudents.map(s => ({
            _id: s._id,
            name: s.name,
            studentID: s.id || '#N/A',
            section: s.section || 'NA', 
            status: 'Present' // Default UI state prior to faculty submission
        }));

        res.json(roster);
    } catch (err) {
        res.status(500).json({ message: "Error fetching course roster data.", error: err.message });
    }
});

module.exports = router;
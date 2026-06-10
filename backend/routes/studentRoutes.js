const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Doubt = require('../models/Doubt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// ==========================================
// 1. STUDENT DASHBOARD & METRICS AGGREGATION
// ==========================================
router.get('/dashboard/:email', async (req, res) => {
    try {
        const student = await User.findOne({ email: req.params.email, role: 'student' });
        if (!student) return res.status(404).json({ message: "Student record not found in registry" });

        const enrolledCourses = await Course.find({ students: student._id })
            .populate('faculty', 'name');

        let totalSessions = 0;
        let presentCount = 0;
        let absentCount = 0;

        let courseDetails = [];

        for (const course of enrolledCourses) {
            // Retrieve telemetry data mapped to the student's specific section or global sessions
            const attendances = await Attendance.find({ 
                courseId: course.courseCode,
                $or: [{ section: student.section }, { section: 'ALL' }, { section: '' }]
            });

            let courseTotal = 0;
            let coursePresent = 0;

            attendances.forEach(att => {
                const record = att.records.find(r => r.studentId.toString() === student._id.toString());
                if (record) {
                    totalSessions++;
                    courseTotal++;
                    
                    if (record.status === 'Present') { 
                        presentCount++; 
                        coursePresent++; 
                    }
                    // Legacy data support: 'Late' status markers are strictly calculated as 'Absent'
                    else if (record.status === 'Absent' || record.status === 'Late') { 
                        absentCount++; 
                    }
                }
            });

            const coursePercentage = courseTotal === 0 ? 0 : Math.round((coursePresent / courseTotal) * 100);

            courseDetails.push({
                courseId: course._id,
                courseCode: course.courseCode,
                courseName: course.courseName,
                facultyName: course.faculty ? course.faculty.name : 'Not Assigned',
                facultyMongoId: course.faculty ? course.faculty._id : null, 
                classTiming: course.classTiming || 'Not Scheduled',
                semester: course.semester,
                attendancePercentage: coursePercentage,
                totalClasses: courseTotal,
                presentClasses: coursePresent 
            });
        }

        const overallPercentage = totalSessions === 0 ? 0 : Math.round((presentCount / totalSessions) * 100);

        // Rule-Based AI Heuristic Engine for automated academic guidance
        let aiInsights = { strengths: [], focusAreas: [], studyPlan: [], quote: "" };
        if (totalSessions === 0) {
            aiInsights.strengths = ["Awaiting class commencement"];
            aiInsights.focusAreas = ["Check timetable regularly"];
            aiInsights.studyPlan = ["Review the syllabus for upcoming classes"];
            aiInsights.quote = `"The secret of getting ahead is getting started."`;
        } else if (overallPercentage >= 80) {
            aiInsights.strengths = ["Excellent attendance record"];
            aiInsights.focusAreas = ["Help peers in group studies"];
            aiInsights.studyPlan = ["Attempt extra credit assignments"];
            aiInsights.quote = `"Keep working hard — every class matters!"`;
        } else if (overallPercentage >= 65) {
            aiInsights.strengths = ["Maintaining minimum criteria"];
            aiInsights.focusAreas = ["Attend all scheduled classes"];
            aiInsights.studyPlan = ["Ensure attendance in upcoming sessions"];
            aiInsights.quote = `"Success is the sum of small efforts."`;
        } else {
            aiInsights.strengths = ["Needs academic intervention"];
            aiInsights.focusAreas = ["Critical attendance shortage"];
            aiInsights.studyPlan = ["Schedule counseling session with faculty"];
            aiInsights.quote = `"It's not whether you get knocked down, it's whether you get up."`;
        }

        res.json({
            student: {
                name: student.name, email: student.email, department: student.department,
                batch: student.batch, initials: student.initials, id: student.id,
                section: student.section, mongoId: student._id 
            },
            stats: { overallPercentage, presentCount, absentCount, totalSessions },
            enrolledCourses: courseDetails,
            aiInsights
        });

    } catch (error) {
        console.error("Student Dashboard Aggregation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 2. ATTENDANCE HISTORY (Detailed Modal View)
// ==========================================
router.get('/attendance-history/:courseCode/:studentId', async (req, res) => {
    try {
        const { courseCode, studentId } = req.params;
        const history = await Attendance.find({ courseId: courseCode }).sort({ date: -1 });

        // Extract and format raw status data for frontend UI rendering
        const formattedHistory = history.map(session => {
            const record = session.records.find(r => r.studentId.toString() === studentId);
            return record ? { date: session.date, status: record.status } : null;
        }).filter(Boolean);

        res.json(formattedHistory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. GRIEVANCE / DOUBT HUB (STUDENT PORTAL)
// ==========================================
router.post('/grievance/submit', async (req, res) => {
    try {
        const { studentId, facultyId, courseCode, question } = req.body;
        if(!studentId || !facultyId || !question) {
            return res.status(400).json({ message: "Payload missing required fields" });
        }
        const newDoubt = await Doubt.create({ studentId, facultyId, courseCode, question });
        res.json({ message: "Grievance submitted successfully.", doubt: newDoubt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/grievance/status/:studentId', async (req, res) => {
    try {
        const doubts = await Doubt.find({ studentId: req.params.studentId })
            .populate('facultyId', 'name')
            .sort({ createdAt: -1 });
        res.json(doubts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4. DYNAMIC QR CODE SCANNER (SECURE ATTENDANCE)
// ==========================================
router.post('/mark-attendance-qr', async (req, res) => {
    try {
        const { token, studentId, email } = req.body;

        let decoded;
        try {
            // Step 1: Cryptographic Token Verification
            // Fails automatically if the 10-second TTL (Time-To-Live) has expired
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ message: "Security Token Expired. Please scan the latest code displayed on the screen." });
        }

        const { courseCode, facultyId} = decoded;

        // Step 2: Identity Spoofing Prevention
        // Verifies that the scanning device belongs to the authenticated user
        const student = await User.findById(studentId);
        if (!student || student.email !== email) {
            return res.status(401).json({ message: "Security Violation: Unauthorized Email Address anomaly detected." });
        }

        // Step 3: Session Initialization & Database Logging
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        let session = await Attendance.findOne({ 
            courseId: courseCode, 
            date: { $gte: todayStart } 
        });

        if (!session) {
            session = new Attendance({
                courseId: courseCode,
                date: new Date(),
                section: student.section, 
                markedBy: facultyId,
                records: []
            });
        }

        // Step 4: Idempotency Check (Prevent duplicate attendance entries)
        const alreadyMarked = session.records.find(r => r.studentId.toString() === studentId);
        if (alreadyMarked) {
            return res.status(400).json({ message: "Attendance log already recorded for today's session." });
        }

        session.records.push({ studentId, status: 'Present' });
        await session.save();

        res.json({ message: "Attendance telemetry recorded successfully.", courseCode });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
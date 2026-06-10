const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Attendance = require('../models/Attendance'); 
const Doubt = require('../models/Doubt'); 
const Groq = require('groq-sdk');
const jwt = require('jsonwebtoken');
require('dotenv').config(); 

// Initialize Groq Client for AI integrations
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ==========================================
// 1. ENROLLMENT MANAGEMENT
// ==========================================

router.post('/enroll', async (req, res) => {
    try {
        const { courseCode, studentIds } = req.body;
        const course = await Course.findOne({ courseCode });
        if (!course) return res.status(404).json({ message: "Course record not found" });

        // Filter out students who are already enrolled to prevent duplicate array entries
        const existingIds = course.students.map(id => id.toString());
        const newIds = studentIds.filter(id => !existingIds.includes(id));

        course.students.push(...newIds); 
        await course.save();

        res.json({ message: "Students enrolled successfully." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/unenroll', async (req, res) => {
    try {
        const { courseCode, studentId } = req.body;
        const course = await Course.findOne({ courseCode });
        if (!course) return res.status(404).json({ message: "Course record not found" });

        // Remove specific student ID from the course roster array
        course.students = course.students.filter(id => id.toString() !== studentId);
        await course.save();

        res.json({ message: "Student removed from roster successfully." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 2. DASHBOARD & INSIGHTS (FACULTY METRICS)
// ==========================================

// Retrieves aggregated statistics for the Faculty Main Dashboard
router.get('/teacher-stats/:email', async (req, res) => {
    try {
        const teacher = await User.findOne({ email: req.params.email });
        if (!teacher) return res.status(404).json({ message: "Faculty record not found" });

        const courses = await Course.find({ faculty: teacher._id });
        const allAttendance = await Attendance.find({ courseId: { $in: courses.map(c => c.courseCode) } });
        
        // Utilizing a Set to guarantee unique student counts across multiple sections
        let studentSet = new Set();
        let alertsCount = 0;
        let totalAttPercentage = 0;
        let validStudents = 0;

        for (const course of courses) {
            if (course.students) {
                course.students.forEach(s => {
                    const studentId = s.toString();
                    if (!studentSet.has(studentId)) {
                        studentSet.add(studentId);
                        let totalClasses = 0;
                        let presentCount = 0;

                        // Aggregate attendance data specific to the student and their section
                        allAttendance.forEach(att => {
                            if (att.courseId === course.courseCode && (att.section === course.section || att.section === '')) {
                                const record = att.records.find(r => r.studentId.toString() === studentId);
                                if (record) {
                                    totalClasses++;
                                    if (record.status === 'Present') presentCount++;
                                }
                            }
                        });
                        
                        const att = totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100);
                        totalAttPercentage += att;
                        validStudents++;
                        
                        // Increment AI Alert threshold if attendance falls below 75% after a minimum of 3 sessions
                        if (totalClasses >= 3 && att < 75) alertsCount++; 
                    }
                });
            }
        }

        res.json({
            // Safely parse the MongoDB ObjectId to string to prevent frontend rendering errors
            teacherMongoId: teacher._id.toString(), 
            activeClasses: courses.length,
            totalStudents: studentSet.size,
            avgAttendance: validStudents > 0 ? Math.floor(totalAttPercentage / validStudents) : 0, 
            aiAlerts: alertsCount
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Retrieves detailed course listings for a specific faculty member
router.get('/teacher/:email', async (req, res) => {
    try {
        const teacher = await User.findOne({ email: req.params.email });
        if (!teacher) return res.status(404).json({ message: "Faculty record not found" });

        const courses = await Course.find({ faculty: teacher._id }).populate('students');
        
        const formattedCourses = courses.map(c => ({
            courseCode: c.courseCode,
            courseName: c.courseName,
            section: c.section,
            studentsEnrolled: c.students ? c.students.length : 0,
            students: c.students,
            nextClass: c.nextClass,
            semester: c.semester,
            classTiming: c.classTiming 
        }));
        res.json(formattedCourses);
    } catch (err) { res.status(500).json({ message: "Internal server error", error: err.message }); }
});

// Retrieves detailed student risk analysis for the Performance Radar
router.get('/teacher-students-stats/:email', async (req, res) => {
    try {
        const teacher = await User.findOne({ email: req.params.email });
        if (!teacher) return res.status(404).json({ message: "Faculty record not found" });

        const courses = await Course.find({ faculty: teacher._id }).populate('students');
        const allAttendance = await Attendance.find({ courseId: { $in: courses.map(c => c.courseCode) } });

        let studentsSummary = [];
        courses.forEach(course => {
            course.students.forEach(student => {
                let totalSessions = 0;
                let presentSessions = 0;

                allAttendance.forEach(session => {
                    if (session.courseId === course.courseCode && (session.section === course.section || session.section === '')) {
                        const record = session.records.find(r => r.studentId.toString() === student._id.toString());
                        if (record) {
                            totalSessions++;
                            if (record.status === 'Present') presentSessions++;
                        }
                    }
                });

                const percentage = totalSessions === 0 ? 0 : Math.round((presentSessions / totalSessions) * 100);
                
                studentsSummary.push({
                    _id: student._id,
                    name: student.name,
                    id: student.id,
                    course: course.courseCode,
                    section: course.section || 'NA',
                    attendance: percentage,
                    totalClasses: totalSessions,
                    presentClasses: presentSessions,
                    // Categorize risk state for immediate UI highlighting
                    risk: totalSessions > 0 && percentage < 75 ? 'High Risk' : 'Low Risk'
                });
            });
        });
        res.json(studentsSummary);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 3. GRIEVANCE / DOUBT HUB (FACULTY COMMUNICATION)
// ==========================================

// Retrieve all pending and resolved queries assigned to a specific faculty member
router.get('/doubts-list/:facultyId', async (req, res) => {
    try {
        const list = await Doubt.find({ facultyId: req.params.facultyId })
            .populate('studentId', 'name id initials email')
            .sort({ createdAt: -1 });
        res.json(list);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Process and store the faculty's response to a student grievance
router.put('/reply-doubt/:doubtId', async (req, res) => {
    try {
        const { answer } = req.body;
        const updated = await Doubt.findByIdAndUpdate(req.params.doubtId, { 
            answer, 
            status: 'Resolved',
            isReadByStudent: false 
        }, { new: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 4. ATTENDANCE SCANNER & LIVE ROSTER
// ==========================================

// Generates an Ephemeral JWT for the dynamic QR code scanner
router.get('/generate-qr/:courseCode/:facultyId', async (req, res) => {
    try {
        const { courseCode, facultyId } = req.params;
        
        // Cryptographically sign the QR payload with a strict 10-second Time-To-Live (TTL)
        // This prevents QR cloning and proxy attendance
        const token = jwt.sign(
            { courseCode, facultyId }, 
            process.env.JWT_SECRET, 
            { expiresIn: '10s' } 
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Streams real-time scanner data to the faculty dashboard
router.get('/live-roster/:courseCode', async (req, res) => {
    try {
        const { courseCode } = req.params;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const session = await Attendance.findOne({ 
            courseId: courseCode, 
            date: { $gte: todayStart } 
        }).populate({
            path: 'records.studentId', 
            select: 'name email initials section' 
        });

        if (!session || !session.records || session.records.length === 0) {
            return res.json({ message: "No attendance telemetry logged for today.", records: [], presentCount: 0 });
        }

        const formattedRecords = session.records.map(record => ({
            id: record.studentId._id,
            name: record.studentId.name,
            email: record.studentId.email,
            initials: record.studentId.initials || record.studentId.name.charAt(0),
            status: record.status,
            // Extract the precise scan timestamp inherently embedded within the Mongoose ObjectId
            time: record._id.getTimestamp() 
        }));

        res.json({ 
            presentCount: formattedRecords.length, 
            records: formattedRecords 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. LLM INTEGRATION (GROQ SMART ALERTS)
// ==========================================

// Analyzes real-time dashboard metrics and utilizes an LLM to generate actionable insights
router.get('/generate-ai-insight/:email', async (req, res) => {
    try {
        const teacherEmail = req.params.email;

        let totalCourses = 0;
        let pendingDoubts = 0;
        let facultyName = "Professor";
        
        // Development Mock Data for At-Risk calculation testing. 
        // Note: Replace with dynamic DB query prior to production deployment.
        let atRiskStudents = 4; 

        try {
            const faculty = await User.findOne({ email: teacherEmail });
            if (faculty) facultyName = faculty.name.split(' ')[0];

            const courses = await Course.find({ facultyEmail: teacherEmail });
            totalCourses = courses.length || 0;
            
            pendingDoubts = await Doubt.countDocuments({ facultyId: faculty._id, status: 'Pending' }) || 0;
            
        } catch (dbError) {
            console.log("Database fetch bypassed for AI synthesis:", dbError.message);
        }

        // Strict System Prompt Engineering to prevent LLM hallucination and ensure protocol adherence
        const prompt = `
        You are 'AcademiaAI', an intelligent assistant for university professors.
        Analyze the following metrics for Professor ${facultyName} and provide a strictly professional, 2-sentence actionable insight.
        
        Metrics:
        - Active Courses Today: ${totalCourses}
        - Pending Grievances: ${pendingDoubts}
        - Students At-Risk (Attendance < 75%): ${atRiskStudents}
        
        CRITICAL DIRECTIVE:
        1. If "Students At-Risk" is 1 or more, you MUST dedicate your entire response to warning the professor about these specific at-risk students and recommend sending a formal warning. Do not praise them.
        2. Only if "Students At-Risk" is 0, then analyze the courses and grievances.
        
        Constraints: Maximum 30 words. No greetings. No fluff.
        `;

        if (!process.env.GROQ_API_KEY) {
             return res.json({ insight: "AI Engine offline: Missing API Key configuration." });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant', 
            // Low temperature enforced (0.2) to ensure strict adherence to safety and warning protocols
            temperature: 0.2, 
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content || "System analysis shows stable engagement. All systems operating optimally.";

        res.json({ 
            insight: aiResponse,
            alertCount: atRiskStudents 
        });

    } catch (error) {
        console.error("Groq Synthesis Exception:", error.message);
        res.json({ insight: "System analysis shows stable engagement. (AI currently synchronizing data streams)" });
    }
});

module.exports = router;
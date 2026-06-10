const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User'); // Required to map System IDs to MongoDB ObjectIds

exports.getDashboardInsights = async (req, res) => {
    try {
        // Map the JWT payload System ID (e.g., F5086) to the internal MongoDB ObjectId
        const systemId = req.user.id; 
        const userRole = req.user.role; 

        // --- FACULTY WORKFLOW ---
        if (userRole === 'faculty') {
            // Step 1: Retrieve the faculty document using the provided System ID
            const teacherRecord = await User.findOne({ id: systemId });
            
            if (!teacherRecord) {
                return res.status(404).json({ success: false, message: "Faculty record not found" });
            }

            // Step 2: Query allotted courses using the MongoDB _id to prevent CastErrors
            const allottedCourses = await Course.find({ faculty: teacherRecord._id });
            
            if (allottedCourses.length === 0) {
                return res.status(200).json({ 
                    success: true, 
                    message: "No sections are allotted to you yet.", 
                    data: [] 
                });
            }

            // Step 3: Extract course and section details to filter attendance records
            const sectionFilters = allottedCourses.map(course => ({
                courseId: course.courseCode,
                section: course.section
            }));

            // Step 4: Fetch attendance data mapped to the faculty's specific sections
            const teacherAttendanceData = await Attendance.find({ $or: sectionFilters });
            const insights = generateAIInsights(teacherAttendanceData);

            return res.status(200).json({
                success: true,
                role: 'faculty',
                allottedSections: allottedCourses.length,
                insights: insights
            });
        }

        // --- ADMIN WORKFLOW ---
        if (userRole === 'admin') {
            const requestedSection = req.query.section; 
            let query = {};
            
            // Allow dynamic filtering by section for administrative oversight
            if (requestedSection) query.section = requestedSection;

            const globalAttendanceData = await Attendance.find(query);
            const insights = generateAIInsights(globalAttendanceData);

            return res.status(200).json({
                success: true,
                role: 'admin',
                viewingSection: requestedSection || 'ALL',
                insights: insights
            });
        }

        // Fallback for unauthorized access attempts
        return res.status(403).json({ success: false, message: "Unauthorized access" });

    } catch (error) {
        console.error("Insights Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Helper Function: Generates statistical insights from attendance records.
 * Acts as a preliminary rule-based aggregation engine.
 */
const generateAIInsights = (attendanceRecords) => {
    let totalClasses = attendanceRecords.length;
    let totalPresents = 0;
    let totalAbsents = 0;

    // Iterate through all sessions and aggregate student status metrics
    attendanceRecords.forEach(session => {
        session.records.forEach(student => {
            if (student.status === 'Present') totalPresents++;
            if (student.status === 'Absent') totalAbsents++;
        });
    });

    let totalRecords = totalPresents + totalAbsents;
    let attendancePercentage = totalRecords === 0 ? 0 : ((totalPresents / totalRecords) * 100).toFixed(2);

    // Define critical thresholds for actionable warnings
    return {
        totalSessionsAnalyzed: totalClasses,
        overallAttendancePercentage: `${attendancePercentage}%`,
        totalPresents,
        totalAbsents,
        warning: attendancePercentage < 75 && totalClasses > 0 ? "CRITICAL: Overall attendance is below 75%!" : "Status Normal"
    };
};
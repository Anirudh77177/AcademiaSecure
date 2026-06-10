const express = require('express');
const router = express.Router();
const Doubt = require('../models/Doubt'); 

// ==========================================
// GRIEVANCE / COMMUNICATION HUB (FACULTY UI)
// ==========================================

/**
 * Route: GET /doubts-list/:facultyId
 * Purpose: Retrieves a chronological list of all grievances assigned to a specific faculty member.
 * Technical Note: Utilizes Mongoose 'populate' for data hydration, fetching necessary nested student metadata.
 */
router.get('/doubts-list/:facultyId', async (req, res) => {
    try {
        console.log(`[TELEMETRY] Fetching grievance registry for Faculty ID: ${req.params.facultyId}`);
        
        const list = await Doubt.find({ facultyId: req.params.facultyId })
            .populate('studentId', 'name id initials')
            .sort({ createdAt: -1 }); // Sorts chronologically, rendering the newest queries at the top
        
        console.log(`[TELEMETRY] Successfully retrieved ${list.length} queries from the registry`);
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve the grievance registry.", details: err.message });
    }
});

/**
 * Route: PUT /reply-doubt/:doubtId
 * Purpose: Processes and persists faculty responses to student grievances.
 * Technical Note: Handles state mutation (Pending -> Resolved) and toggles notification flags for the student UI.
 */
router.put('/reply-doubt/:doubtId', async (req, res) => {
    try {
        const { answer } = req.body;
        
        // State Mutation: Updates the answer payload, transitions the lifecycle status, 
        // and triggers the unread notification flag for the student dashboard.
        const updated = await Doubt.findByIdAndUpdate(
            req.params.doubtId, 
            { 
                answer, 
                status: 'Resolved',
                isReadByStudent: false // Notification Flagging: Prompts a UI alert on the student side
            }, 
            { new: true } // Returns the newly mutated document to update the UI instantly
        );
        
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to process grievance resolution.", details: err.message });
    }
});

module.exports = router;
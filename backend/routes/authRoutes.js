const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

/**
 * Mail Transporter Configuration
 * Utilizes Nodemailer with SMTP settings securely fetched from environment variables.
 * (Note: Requires an 'App Password' configuration if routing through Gmail in production).
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ==========================================
// ROUTE: REQUEST OTP (Authentication Step 1)
// ==========================================
router.post('/request-otp', async (req, res) => {
    try {
        // Identifier Normalization: Accepts either an Email or an Institutional System ID
        const { identifier } = req.body; 
        const cleanId = identifier.toLowerCase().trim();

        console.log("--- OTP Request Initiated ---");
        console.log("Provided Identifier:", cleanId);

        // Locate the user using either normalized email or uppercase system ID
        const user = await User.findOne({
            $or: [
                { email: cleanId },
                { id: identifier.toUpperCase().trim() }
            ]
        });

        if (!user) {
            console.log("Result: User registry lookup failed");
            return res.status(404).json({ message: "User not found in the AcademiaAI registry." });
        }

        // Generate a secure 6-digit One-Time Password
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Apply a Time-To-Live (TTL) of 10 minutes to the OTP and persist to database
        user.otp = otp;
        user.otpExpires = Date.now() + 600000; 
        await user.save();

        // Dispatch the OTP via formatted HTML email
        const mailOptions = {
            from: `"AcademiaAI Security" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Login Verification Code - AcademiaAI',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #2563eb;">Welcome back, ${user.name}!</h2>
                    <p style="font-size: 16px; color: #444;">To access your secure dashboard, use the verification code below:</p>
                    <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #1e293b;">${otp}</span>
                    </div>
                    <p style="font-size: 12px; color: #64748b; margin-top: 20px;">This code is valid for 10 minutes. If you did not initiate this request, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("Result: Security payload dispatched to", user.email);
        
        res.json({ message: "OTP transmitted successfully.", email: user.email });

    } catch (err) {
        console.error("OTP REQUEST EXCEPTION:", err.message);
        res.status(500).json({ message: "Failed to process OTP request", error: err.message });
    }
});

// ==========================================
// ROUTE: VERIFY OTP & ISSUE JWT (Authentication Step 2)
// ==========================================
router.post('/verify-otp', async (req, res) => {
    try {
        const { identifier, otp } = req.body;
        const cleanId = identifier.toLowerCase().trim();

        // Locate the user record
        const user = await User.findOne({
            $or: [
                { email: cleanId },
                { id: identifier.toUpperCase().trim() }
            ]
        });

        if (!user) return res.status(404).json({ message: "User registry lookup failed." });

        // Validate OTP presence and exact string match
        if (!user.otp || user.otp !== otp) {
            return res.status(401).json({ message: "Invalid credentials. Please verify your OTP." });
        }

        // Validate OTP Time-To-Live (TTL) has not expired
        if (user.otpExpires < Date.now()) {
            return res.status(401).json({ message: "OTP has expired. Please request a new authentication code." });
        }

        // State Mutation: Clear ephemeral security states to prevent replay attacks
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        // Issue a stateless JSON Web Token for secure session management across the application
        const secret = process.env.JWT_SECRET || 'supersecretkey';
        const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '7d' });

        console.log("Authentication Successful for:", user.name, `[Role: ${user.role}]`);

        res.json({ 
            token, 
            role: user.role, 
            name: user.name,
            email: user.email,
            id: user.id,
            message: "Authentication protocol completed successfully." 
        });

    } catch (err) {
        console.error("VERIFY OTP EXCEPTION:", err.message);
        res.status(500).json({ message: "Internal server error during verification", error: err.message });
    }
});

module.exports = router;
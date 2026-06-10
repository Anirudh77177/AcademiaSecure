// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Protects secure routes by verifying the presence and validity of a JSON Web Token (JWT).
 */
const protect = async (req, res, next) => {
    let token;

    // Verify the presence of the Authorization header and Bearer token format
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token string from the "Bearer <token>" format
            token = req.headers.authorization.split(' ')[1];

            // Decode and verify the JWT payload using the environment secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the authenticated user from the database and attach it to the request object.
            // Exclude the password field for security purposes.
            req.user = await User.findById(decoded.id).select('-password');

            // Proceed to the next middleware or the designated route handler
            next();
        } catch (error) {
            console.error("Auth Error:", error.message);
            return res.status(401).json({ message: 'Not authorized, token validation failed' });
        }
    }

    // Reject the request if no token was provided in the headers
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };
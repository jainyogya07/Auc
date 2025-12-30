const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';

// Hardcoded Credentials (as per plan)
const ADMIN_CREDS = { username: 'admin', password: 'admin123' };
const AUCTIONEER_CREDS = { username: 'auctioneer', password: 'auc123' };

function generateToken(payload) {
    // Expires in 24 hours for valid session
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (err) {
        return null;
    }
}

// Middleware for Express
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    const user = verifyToken(token);
    if (!user) return res.sendStatus(403);

    req.user = user;
    next();
}

// Socket.io Middleware
function socketAuth(socket, next) {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    const user = verifyToken(token);
    if (!user) return next(new Error('Authentication error'));

    socket.user = user; // Attach user to socket
    next();
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    socketAuth,
    ADMIN_CREDS,
    AUCTIONEER_CREDS
};

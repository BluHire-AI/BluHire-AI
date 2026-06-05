"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_util_1 = require("../utils/jwt.util");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(`[AUTH] Incoming Authorization Header:`, authHeader ? `${authHeader.substring(0, 25)}...` : 'NONE');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log(`[AUTH] Failure: Missing or invalid Authorization header format.`);
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, jwt_util_1.verifyAccessToken)(token);
        console.log(`[AUTH] JWT verification successful. User ID extracted: ${decoded.id}, Role: ${decoded.role}`);
        req.user = {
            _id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        console.log(`[AUTH] Failure: JWT verification failed. Reason: ${error.message}`);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};
exports.authenticate = authenticate;

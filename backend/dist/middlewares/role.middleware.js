"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            res.status(403).json({ success: false, message: 'User role not found' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;

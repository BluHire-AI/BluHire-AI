"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map((details) => details.message);
            res.status(400).json({ success: false, errors });
            return;
        }
        next();
    };
};
exports.validateRequest = validateRequest;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    async register(req, res, next) {
        try {
            const result = await auth_service_1.authService.register(req.body);
            res.status(201).json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const result = await auth_service_1.authService.login(req.body);
            res.status(200).json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                },
            });
        }
        catch (error) {
            if (error.message === 'Invalid credentials') {
                res.status(401).json({ success: false, message: error.message });
            }
            else {
                next(error);
            }
        }
    }
    async logout(req, res, next) {
        try {
            await auth_service_1.authService.logout(req.user.id);
            res.status(200).json({ success: true, message: 'Logged out successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await auth_service_1.authService.refreshTokens(refreshToken);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            if (error.message === 'Invalid refresh token') {
                res.status(401).json({ success: false, message: error.message });
            }
            else {
                next(error);
            }
        }
    }
    async changePassword(req, res, next) {
        try {
            await auth_service_1.authService.changePassword(req.user.id, req.body);
            res.status(200).json({ success: true, message: 'Password updated successfully' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();

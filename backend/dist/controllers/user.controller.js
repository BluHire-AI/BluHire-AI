"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
class UserController {
    async getMe(req, res, next) {
        try {
            const user = await user_service_1.userService.getProfile(req.user.id);
            res.status(200).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    }
    async updateMe(req, res, next) {
        try {
            const user = await user_service_1.userService.updateProfile(req.user.id, req.body);
            res.status(200).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    }
    async listUsers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filter = {};
            if (req.query.role)
                filter.role = req.query.role;
            if (req.query.search) {
                const searchRegex = new RegExp(req.query.search, 'i');
                filter.$or = [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex },
                    { employeeId: searchRegex }
                ];
            }
            const result = await user_service_1.userService.listUsers(page, limit, filter);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getUser(req, res, next) {
        try {
            const user = await user_service_1.userService.getProfile(req.params.id);
            res.status(200).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    }
    async updateUser(req, res, next) {
        try {
            const user = await user_service_1.userService.updateProfile(req.params.id, req.body);
            res.status(200).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteUser(req, res, next) {
        try {
            await user_service_1.userService.softDeleteUser(req.params.id);
            res.status(200).json({ success: true, message: 'User deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();

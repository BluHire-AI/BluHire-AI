"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const user_repository_1 = require("../repositories/user.repository");
class UserService {
    async getProfile(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    async updateProfile(userId, updateData) {
        const user = await user_repository_1.userRepository.updateById(userId, updateData);
        if (!user)
            throw new Error('User not found');
        return user;
    }
    async listUsers(page, limit, filterParams) {
        return await user_repository_1.userRepository.listUsers(page, limit, filterParams);
    }
    async softDeleteUser(userId) {
        return await user_repository_1.userRepository.softDelete(userId);
    }
}
exports.UserService = UserService;
exports.userService = new UserService();

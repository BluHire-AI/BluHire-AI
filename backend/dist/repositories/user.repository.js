"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const User_1 = require("../models/User");
class UserRepository {
    async create(userData) {
        const user = new User_1.User(userData);
        return await user.save();
    }
    async findByEmail(email) {
        return await User_1.User.findOne({ email });
    }
    async findById(id) {
        return await User_1.User.findById(id);
    }
    async updateById(id, updateData) {
        return await User_1.User.findByIdAndUpdate(id, updateData, { new: true });
    }
    async updateRefreshToken(id, refreshToken) {
        await User_1.User.findByIdAndUpdate(id, { refreshToken });
    }
    async findByRefreshToken(refreshToken) {
        return await User_1.User.findOne({ refreshToken });
    }
    async listUsers(page, limit, filter = {}) {
        const skip = (page - 1) * limit;
        const users = await User_1.User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });
        const total = await User_1.User.countDocuments(filter);
        return { users, total };
    }
    async softDelete(id) {
        return await User_1.User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();

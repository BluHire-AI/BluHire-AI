"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const user_repository_1 = require("../repositories/user.repository");
const password_util_1 = require("../utils/password.util");
const jwt_util_1 = require("../utils/jwt.util");
class AuthService {
    async register(data) {
        const existingUser = await user_repository_1.userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new Error('Email is already registered');
        }
        const hashedPassword = await (0, password_util_1.hashPassword)(data.password);
        const user = await user_repository_1.userRepository.create({
            ...data,
            passwordHash: hashedPassword,
        });
        const { accessToken, refreshToken } = (0, jwt_util_1.generateTokens)(user);
        await user_repository_1.userRepository.updateRefreshToken(user.id, refreshToken);
        return { user, accessToken, refreshToken };
    }
    async login(data) {
        const user = await user_repository_1.userRepository.findByEmail(data.email);
        if (!user || !user.isActive) {
            throw new Error('Invalid credentials');
        }
        const isMatch = await (0, password_util_1.comparePassword)(data.password, user.passwordHash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        const { accessToken, refreshToken } = (0, jwt_util_1.generateTokens)(user);
        await user_repository_1.userRepository.updateRefreshToken(user.id, refreshToken);
        return { user, accessToken, refreshToken };
    }
    async logout(userId) {
        await user_repository_1.userRepository.updateRefreshToken(userId, null);
    }
    async refreshTokens(token) {
        try {
            const decoded = (0, jwt_util_1.verifyRefreshToken)(token);
            const user = await user_repository_1.userRepository.findById(decoded.id);
            if (!user || user.refreshToken !== token) {
                throw new Error('Invalid refresh token');
            }
            const { accessToken, refreshToken } = (0, jwt_util_1.generateTokens)(user);
            await user_repository_1.userRepository.updateRefreshToken(user.id, refreshToken);
            return { accessToken, refreshToken };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    async changePassword(userId, data) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            throw new Error('User not found');
        const isMatch = await (0, password_util_1.comparePassword)(data.oldPassword, user.passwordHash);
        if (!isMatch)
            throw new Error('Incorrect old password');
        const hashedPassword = await (0, password_util_1.hashPassword)(data.newPassword);
        await user_repository_1.userRepository.updateById(userId, { passwordHash: hashedPassword });
    }
    async forgotPassword(email) {
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user) {
            return { success: true };
        }
        const resetToken = (0, jwt_util_1.generateResetToken)(user);
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        console.log('------------------------------------');
        console.log(`Password reset requested for: ${email}`);
        console.log(`Reset Link: ${resetLink}`);
        console.log('------------------------------------');
        return { success: true, resetToken, resetLink };
    }
    async resetPassword(data) {
        try {
            const decoded = (0, jwt_util_1.verifyResetToken)(data.token);
            const user = await user_repository_1.userRepository.findById(decoded.id);
            if (!user)
                throw new Error('User not found');
            const hashedPassword = await (0, password_util_1.hashPassword)(data.newPassword);
            await user_repository_1.userRepository.updateById(user.id, { passwordHash: hashedPassword });
            await user_repository_1.userRepository.updateRefreshToken(user.id, null);
        }
        catch (error) {
            throw new Error(error.message || 'Invalid or expired reset token');
        }
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();

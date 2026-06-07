"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const user_repository_1 = require("../repositories/user.repository");
const password_util_1 = require("../utils/password.util");
const jwt_util_1 = require("../utils/jwt.util");
const roles_1 = require("../models/roles");
const InterviewAssignment_1 = __importDefault(require("../models/InterviewAssignment"));
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
    async verifyMagicToken(token) {
        const assignment = await InterviewAssignment_1.default.findOne({
            magicToken: token,
            isTokenUsed: false,
            magicTokenExpiresAt: { $gt: new Date() }
        }).populate({
            path: 'candidateId',
            match: { isDeleted: false }
        }).populate({
            path: 'jobId',
            match: { isDeleted: false }
        });
        if (!assignment) {
            throw new Error('Invalid or expired activation token');
        }
        return assignment;
    }
    async activateCandidate(token, password) {
        const assignment = await this.verifyMagicToken(token);
        const candidate = assignment.candidateId;
        if (!candidate) {
            throw new Error('Candidate associated with this token not found');
        }
        let user = await user_repository_1.userRepository.findByEmail(candidate.email);
        const hashedPassword = await (0, password_util_1.hashPassword)(password);
        if (!user) {
            // Create new candidate User account
            user = await user_repository_1.userRepository.create({
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                email: candidate.email,
                phone: candidate.phone,
                employeeId: `CAND-${candidate.candidateCode}`,
                role: roles_1.SystemRoles.CANDIDATE,
                passwordHash: hashedPassword,
                isActive: true
            });
        }
        else {
            // Update existing user with candidate credentials/role
            user = await user_repository_1.userRepository.updateById(user._id.toString(), {
                role: roles_1.SystemRoles.CANDIDATE,
                passwordHash: hashedPassword,
                isActive: true
            });
        }
        // Invalidate the single-use token
        assignment.isTokenUsed = true;
        await assignment.save();
        const { accessToken, refreshToken } = (0, jwt_util_1.generateTokens)(user);
        await user_repository_1.userRepository.updateRefreshToken(user.id, refreshToken);
        return { user, accessToken, refreshToken };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();

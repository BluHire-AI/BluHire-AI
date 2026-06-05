"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidatesService = void 0;
const candidate_repository_1 = __importDefault(require("../repositories/candidate.repository"));
const Candidate_1 = __importDefault(require("../../../models/Candidate"));
class CandidatesService {
    /**
     * Generate a unique Candidate Code
     */
    async generateCandidateCode() {
        const year = new Date().getFullYear();
        const count = await Candidate_1.default.countDocuments();
        const nextNumber = (count + 1).toString().padStart(5, '0');
        let candidateCode = `CAN-${year}-${nextNumber}`;
        // Verify uniqueness
        let exists = await candidate_repository_1.default.codeExists(candidateCode);
        let retry = 0;
        while (exists && retry < 10) {
            retry++;
            const randomSuffix = Math.floor(100 + Math.random() * 900);
            candidateCode = `CAN-${year}-${nextNumber}-${randomSuffix}`;
            exists = await candidate_repository_1.default.codeExists(candidateCode);
        }
        return candidateCode;
    }
    /**
     * Create a new candidate
     */
    async createCandidate(candidateData, userId) {
        // Check if candidate with email already exists
        if (candidateData.email) {
            const existingCandidate = await candidate_repository_1.default.findByEmail(candidateData.email);
            if (existingCandidate) {
                throw new Error(`A candidate with email "${candidateData.email}" already exists.`);
            }
        }
        const candidateCode = await this.generateCandidateCode();
        const candidate = await candidate_repository_1.default.create({
            ...candidateData,
            candidateCode,
            createdBy: userId,
        });
        return candidate;
    }
    /**
     * Get or Create Candidate by email (specifically for Application Submission)
     */
    async getOrCreateCandidate(candidateData, userId) {
        if (!candidateData.email) {
            throw new Error('Email is required to locate or create candidate.');
        }
        const existingCandidate = await candidate_repository_1.default.findByEmail(candidateData.email);
        if (existingCandidate) {
            // Update candidate details if they applied again (updated resume, company, etc.)
            const updatedCandidate = await candidate_repository_1.default.update(existingCandidate._id, {
                firstName: candidateData.firstName || existingCandidate.firstName,
                lastName: candidateData.lastName || existingCandidate.lastName,
                phone: candidateData.phone || existingCandidate.phone,
                skills: candidateData.skills?.length ? candidateData.skills : existingCandidate.skills,
                experience: candidateData.experience || existingCandidate.experience,
                education: candidateData.education || existingCandidate.education,
                resume: candidateData.resume || existingCandidate.resume,
                linkedinUrl: candidateData.linkedinUrl || existingCandidate.linkedinUrl,
                portfolioUrl: candidateData.portfolioUrl || existingCandidate.portfolioUrl,
                currentCompany: candidateData.currentCompany || existingCandidate.currentCompany,
                currentDesignation: candidateData.currentDesignation || existingCandidate.currentDesignation,
                expectedSalary: candidateData.expectedSalary || existingCandidate.expectedSalary,
                noticePeriod: candidateData.noticePeriod || existingCandidate.noticePeriod,
                updatedBy: userId,
            });
            return updatedCandidate;
        }
        // Creating fresh candidate
        return await this.createCandidate(candidateData, userId);
    }
    /**
     * Update Candidate Details
     */
    async updateCandidate(candidateId, updateData, userId) {
        const existing = await candidate_repository_1.default.findById(candidateId);
        if (!existing) {
            throw new Error('Candidate not found');
        }
        // Email update safety check
        if (updateData.email && updateData.email.toLowerCase().trim() !== existing.email.toLowerCase().trim()) {
            const emailDuplicate = await candidate_repository_1.default.findByEmail(updateData.email);
            if (emailDuplicate) {
                throw new Error(`Email "${updateData.email}" is already taken by another candidate.`);
            }
        }
        return await candidate_repository_1.default.update(candidateId, {
            ...updateData,
            updatedBy: userId,
        });
    }
    /**
     * Delete candidate (soft delete)
     */
    async deleteCandidate(candidateId) {
        return await candidate_repository_1.default.softDelete(candidateId);
    }
    /**
     * Get Candidate details
     */
    async getCandidateDetails(candidateId) {
        return await candidate_repository_1.default.findById(candidateId);
    }
    /**
     * List candidates with pagination and search (Admin/Recruiter)
     */
    async listCandidates(query, pagination) {
        return await candidate_repository_1.default.findWithPagination(query, pagination);
    }
}
exports.CandidatesService = CandidatesService;
exports.default = new CandidatesService();

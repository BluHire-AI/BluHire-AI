"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateRepository = void 0;
const Candidate_1 = __importDefault(require("../../../models/Candidate"));
class CandidateRepository {
    /**
     * Create a new candidate record
     */
    async create(candidateData) {
        const candidate = new Candidate_1.default(candidateData);
        return await candidate.save();
    }
    /**
     * Find candidate by ID
     */
    async findById(candidateId) {
        return await Candidate_1.default.findOne({ _id: candidateId, isDeleted: false })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
    }
    /**
     * Find candidate by email (active candidate)
     */
    async findByEmail(email) {
        return await Candidate_1.default.findOne({
            email: email.toLowerCase().trim(),
            isDeleted: false,
        });
    }
    /**
     * Find candidate by code
     */
    async findByCode(candidateCode) {
        return await Candidate_1.default.findOne({
            candidateCode: candidateCode.toUpperCase(),
            isDeleted: false,
        });
    }
    /**
     * Update candidate details
     */
    async update(candidateId, updateData) {
        return await Candidate_1.default.findOneAndUpdate({ _id: candidateId, isDeleted: false }, { ...updateData, updatedAt: new Date() }, { returnDocument: 'after', runValidators: true });
    }
    /**
     * Soft delete candidate
     */
    async softDelete(candidateId) {
        return await Candidate_1.default.findByIdAndUpdate(candidateId, { isDeleted: true, updatedAt: new Date() }, { returnDocument: 'after' });
    }
    /**
     * Find candidates with search filters and pagination
     */
    async findWithPagination(query, pagination = { page: 1, limit: 10 }) {
        const page = Math.max(1, pagination.page || 1);
        const limit = Math.min(100, pagination.limit || 10);
        const skip = (page - 1) * limit;
        const filter = { isDeleted: false };
        if (query.status) {
            filter.status = query.status;
        }
        if (query.search) {
            filter.$or = [
                { candidateCode: new RegExp(query.search, 'i') },
                { firstName: new RegExp(query.search, 'i') },
                { lastName: new RegExp(query.search, 'i') },
                { email: new RegExp(query.search, 'i') },
                { phone: new RegExp(query.search, 'i') },
            ];
        }
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortOrder };
        const [candidates, total] = await Promise.all([
            Candidate_1.default.find(filter).sort(sort).skip(skip).limit(limit),
            Candidate_1.default.countDocuments(filter),
        ]);
        return { candidates, total };
    }
    /**
     * Check if candidate code exists
     */
    async codeExists(candidateCode) {
        const count = await Candidate_1.default.countDocuments({
            candidateCode: candidateCode.toUpperCase(),
            isDeleted: false,
        });
        return count > 0;
    }
    /**
     * Get total candidates count
     */
    async countAll() {
        return await Candidate_1.default.countDocuments({ isDeleted: false });
    }
}
exports.CandidateRepository = CandidateRepository;
exports.default = new CandidateRepository();

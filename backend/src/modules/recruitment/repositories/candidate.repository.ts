import CandidateModel, { ICandidate } from '../../../models/Candidate';
import { PaginationDTO } from '../../employee/dtos/common.dto';

export interface CandidateQueryDTO {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CandidateRepository {
  /**
   * Create a new candidate record
   */
  async create(candidateData: Partial<ICandidate>): Promise<ICandidate> {
    const candidate = new CandidateModel(candidateData);
    return await candidate.save();
  }

  /**
   * Find candidate by ID
   */
  async findById(candidateId: string): Promise<ICandidate | null> {
    return await CandidateModel.findOne({ _id: candidateId, isDeleted: false })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');
  }

  /**
   * Find candidate by email (active candidate)
   */
  async findByEmail(email: string): Promise<ICandidate | null> {
    return await CandidateModel.findOne({
      email: email.toLowerCase().trim(),
      isDeleted: false,
    });
  }

  /**
   * Find candidate by code
   */
  async findByCode(candidateCode: string): Promise<ICandidate | null> {
    return await CandidateModel.findOne({
      candidateCode: candidateCode.toUpperCase(),
      isDeleted: false,
    });
  }

  /**
   * Update candidate details
   */
  async update(candidateId: string, updateData: Partial<ICandidate>): Promise<ICandidate | null> {
    return await CandidateModel.findOneAndUpdate(
      { _id: candidateId, isDeleted: false },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Soft delete candidate
   */
  async softDelete(candidateId: string): Promise<ICandidate | null> {
    return await CandidateModel.findByIdAndUpdate(
      candidateId,
      { isDeleted: true, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Find candidates with search filters and pagination
   */
  async findWithPagination(
    query: CandidateQueryDTO,
    pagination: PaginationDTO = { page: 1, limit: 10 }
  ): Promise<{ candidates: ICandidate[]; total: number }> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, pagination.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: false };

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
    const sort: any = { [sortBy]: sortOrder };

    const [candidates, total] = await Promise.all([
      CandidateModel.find(filter).sort(sort).skip(skip).limit(limit),
      CandidateModel.countDocuments(filter),
    ]);

    return { candidates, total };
  }

  /**
   * Check if candidate code exists
   */
  async codeExists(candidateCode: string): Promise<boolean> {
    const count = await CandidateModel.countDocuments({
      candidateCode: candidateCode.toUpperCase(),
      isDeleted: false,
    });
    return count > 0;
  }

  /**
   * Get total candidates count
   */
  async countAll(): Promise<number> {
    return await CandidateModel.countDocuments({ isDeleted: false });
  }
}

export default new CandidateRepository();

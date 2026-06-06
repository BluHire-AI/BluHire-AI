import InterviewSession, { IInterviewSession } from '../models/InterviewSession';
import { CreateInterviewSessionDTO, UpdateSessionStatusDTO } from '../dto/interview.dto';

export class InterviewSessionRepository {
  async create(sessionData: CreateInterviewSessionDTO & { totalQuestions: number }): Promise<IInterviewSession> {
    const session = new InterviewSession(sessionData);
    return await session.save();
  }

  async findById(id: string): Promise<IInterviewSession | null> {
    return await InterviewSession.findById(id)
      .populate('candidateId')
      .populate('templateId')
      .populate('recruiterId');
  }

  async updateById(id: string, updateData: UpdateSessionStatusDTO): Promise<IInterviewSession | null> {
    return await InterviewSession.findByIdAndUpdate(id, updateData, { new: true });
  }

  async listSessions(
    page: number, 
    limit: number, 
    filter: any = {}, 
    sort: any = { createdAt: -1 }
  ): Promise<{ sessions: IInterviewSession[]; total: number }> {
    const skip = (page - 1) * limit;
    const sessions = await InterviewSession.find(filter)
      .populate('candidateId')
      .populate('templateId')
      .populate('recruiterId')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    const total = await InterviewSession.countDocuments(filter);
    
    return { sessions, total };
  }
}

export const interviewSessionRepository = new InterviewSessionRepository();

import InterviewQuestion, { IInterviewQuestion } from '../models/InterviewQuestion';

export class InterviewQuestionRepository {
  async createMany(questionsData: any[]): Promise<IInterviewQuestion[]> {
    return await InterviewQuestion.insertMany(questionsData);
  }

  async findByTemplateId(templateId: string): Promise<IInterviewQuestion[]> {
    return await InterviewQuestion.find({ templateId }).sort({ createdAt: 1 });
  }

  async deleteById(id: string): Promise<IInterviewQuestion | null> {
    return await InterviewQuestion.findByIdAndDelete(id);
  }

  async deleteByTemplateId(templateId: string): Promise<any> {
    return await InterviewQuestion.deleteMany({ templateId });
  }
}

export const interviewQuestionRepository = new InterviewQuestionRepository();

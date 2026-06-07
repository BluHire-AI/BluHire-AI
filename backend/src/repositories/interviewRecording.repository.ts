import InterviewRecording, { IInterviewRecording } from '../models/InterviewRecording';

export class InterviewRecordingRepository {
  async create(data: Partial<IInterviewRecording>): Promise<IInterviewRecording> {
    const recording = new InterviewRecording(data);
    return await recording.save();
  }

  async findById(id: string): Promise<IInterviewRecording | null> {
    return await InterviewRecording.findById(id).populate('candidateId').populate('questionId');
  }

  async findBySessionAndQuestion(sessionId: string, questionId: string): Promise<IInterviewRecording | null> {
    return await InterviewRecording.findOne({ sessionId, questionId });
  }

  async deleteById(id: string): Promise<IInterviewRecording | null> {
    return await InterviewRecording.findByIdAndDelete(id);
  }
}

export const interviewRecordingRepository = new InterviewRecordingRepository();

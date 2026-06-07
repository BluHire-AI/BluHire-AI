import InterviewTemplate, { IInterviewTemplate } from '../models/InterviewTemplate';
import { CreateInterviewTemplateDTO, UpdateInterviewTemplateDTO } from '../dto/interview.dto';

export class InterviewTemplateRepository {
  async create(templateData: CreateInterviewTemplateDTO & { createdBy: string }): Promise<IInterviewTemplate> {
    const template = new InterviewTemplate(templateData);
    return await template.save();
  }

  async findById(id: string): Promise<IInterviewTemplate | null> {
    return await InterviewTemplate.findById(id).populate('departmentId');
  }

  async updateById(id: string, updateData: UpdateInterviewTemplateDTO & { updatedBy?: string }): Promise<IInterviewTemplate | null> {
    return await InterviewTemplate.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteById(id: string): Promise<IInterviewTemplate | null> {
    return await InterviewTemplate.findByIdAndDelete(id);
  }

  async listTemplates(
    page: number, 
    limit: number, 
    filter: any = {}, 
    sort: any = { createdAt: -1 }
  ): Promise<{ templates: IInterviewTemplate[]; total: number }> {
    const skip = (page - 1) * limit;
    const templates = await InterviewTemplate.find(filter)
      .populate('departmentId')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    const total = await InterviewTemplate.countDocuments(filter);
    
    return { templates, total };
  }
}

export const interviewTemplateRepository = new InterviewTemplateRepository();

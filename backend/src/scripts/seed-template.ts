import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import InterviewTemplate from '../models/InterviewTemplate';
import { Difficulty, TemplateStatus, QuestionCategory } from '../types/interview.types';

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('MONGO_URI is not defined in the environment variables.');
  process.exit(1);
}

const seedTemplate = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully.');

    // Check if an active template already exists
    const existingTemplate = await InterviewTemplate.findOne({ status: TemplateStatus.ACTIVE });
    if (existingTemplate) {
      console.log('An active Interview Template already exists. ID:', existingTemplate._id);
      process.exit(0);
    }

    // Try to find a Department and User to link
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection failed.');

    const department = await db.collection('departments').findOne({});
    const user = await db.collection('users').findOne({});

    const departmentId = department ? department._id : new mongoose.Types.ObjectId();
    const createdBy = user ? user._id : new mongoose.Types.ObjectId();

    console.log(`Using Department ID: ${departmentId}`);
    console.log(`Using User ID: ${createdBy}`);

    const newTemplate = new InterviewTemplate({
      title: 'Software Engineer Assessment - Core',
      jobRole: 'Software Engineer',
      departmentId,
      experienceLevel: 'Entry to Mid',
      skills: ['JavaScript', 'React', 'Node.js', 'System Design'],
      difficulty: Difficulty.INTERMEDIATE,
      questionCount: 5,
      durationMinutes: 30,
      categories: [
        QuestionCategory.TECHNICAL,
        QuestionCategory.PROBLEM_SOLVING,
        QuestionCategory.COMMUNICATION
      ],
      status: TemplateStatus.ACTIVE,
      createdBy,
    });

    await newTemplate.save();
    console.log('Successfully created default active Interview Template:', newTemplate._id);

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed Interview Template:', error);
    process.exit(1);
  }
};

seedTemplate();

require('dotenv').config();
const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const InterviewTemplate = mongoose.connection.collection('interviewtemplates');
  const InterviewQuestion = mongoose.connection.collection('interviewquestions');
  const Department = mongoose.connection.collection('departments');
  const User = mongoose.connection.collection('users');

  // get a user and department
  let user = await User.findOne({});
  let department = await Department.findOne({});

  if (!department) {
    const deptResult = await Department.insertOne({ name: 'Engineering', isActive: true, createdAt: new Date() });
    department = { _id: deptResult.insertedId };
  }

  // Create template
  const templateDoc = {
    name: 'Software Engineer Assessment', // legacy index satisfaction
    title: 'Software Engineer Assessment',
    jobRole: 'Software Engineer',
    departmentId: department._id,
    experienceLevel: '3-5',
    skills: ['React', 'Node.js', 'System Design'],
    difficulty: 'INTERMEDIATE',
    questionCount: 5,
    durationMinutes: 30,
    categories: ['TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'PROBLEM_SOLVING'],
    status: 'ACTIVE',
    createdBy: user ? user._id : new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // To avoid duplicate key if running again, let's just delete the old one or use an existing one if it exists
  await InterviewTemplate.deleteMany({ title: 'Software Engineer Assessment' });

  const templateResult = await InterviewTemplate.insertOne(templateDoc);
  const templateId = templateResult.insertedId;
  console.log(`Created Template: ${templateId}`);

  // Create questions
  const questions = [
    {
      templateId,
      questionText: 'Describe your experience with React and state management.',
      category: 'TECHNICAL',
      difficulty: 'INTERMEDIATE',
      expectedKeywords: ['react', 'state', 'redux', 'context', 'hooks', 'zustand'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      templateId,
      questionText: 'Tell me about a time you had to learn a new technology quickly.',
      category: 'BEHAVIORAL',
      difficulty: 'BEGINNER',
      expectedKeywords: ['learn', 'quickly', 'adapt', 'challenge', 'project', 'documentation'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      templateId,
      questionText: 'How do you optimize the performance of a large-scale Node.js application?',
      category: 'TECHNICAL',
      difficulty: 'ADVANCED',
      expectedKeywords: ['performance', 'node', 'event loop', 'clustering', 'caching', 'redis', 'profiling'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      templateId,
      questionText: 'Walk me through how you would design a rate-limiting service.',
      category: 'SYSTEM_DESIGN',
      difficulty: 'ADVANCED',
      expectedKeywords: ['rate limit', 'token bucket', 'leaky bucket', 'redis', 'distributed', 'api gateway'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      templateId,
      questionText: 'Describe your approach to debugging a critical production outage.',
      category: 'PROBLEM_SOLVING',
      difficulty: 'INTERMEDIATE',
      expectedKeywords: ['debugging', 'production', 'logs', 'metrics', 'revert', 'communication', 'post-mortem'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await InterviewQuestion.deleteMany({ templateId });
  await InterviewQuestion.insertMany(questions);
  console.log(`Created 5 questions for template: ${templateId}`);
  
  // Make all existing public links use this template
  const Job = mongoose.connection.collection('jobs');
  const InterviewSession = mongoose.connection.collection('interviewsessions');
  
  await Job.updateMany({}, { $set: { interviewTemplateId: templateId } });
  await InterviewSession.updateMany({}, { $set: { templateId: templateId, totalQuestions: 5 } });
  console.log('Updated existing jobs and sessions to use this new template.');
  
  await mongoose.disconnect();
}

seed().catch(console.error);

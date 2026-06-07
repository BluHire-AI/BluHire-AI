require('dotenv').config();
const mongoose = require('mongoose');

async function audit() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const templates = await mongoose.connection.collection('interviewtemplates').find({}).toArray();
  const questions = await mongoose.connection.collection('interviewquestions').find({}).toArray();
  
  let activeCount = 0;
  let noQuestionCount = 0;
  let questionsPerTemplate = {};
  
  for (const t of templates) {
    if (t.isActive) activeCount++;
    const count = questions.filter(q => q.templateId && q.templateId.toString() === t._id.toString()).length;
    questionsPerTemplate[t._id.toString()] = count;
    if (count === 0) noQuestionCount++;
  }
  
  console.log('--- AUDIT RESULTS ---');
  console.log(`Number of templates: ${templates.length}`);
  console.log(`Number of active templates: ${activeCount}`);
  console.log(`Templates with zero questions: ${noQuestionCount}`);
  console.log(`Questions per template:`, questionsPerTemplate);
  
  await mongoose.disconnect();
}

audit().catch(console.error);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const candidateSchema = new mongoose.Schema({}, { collection: 'candidates', strict: false });
const Candidate = mongoose.model('Candidate', candidateSchema);

const applicationSchema = new mongoose.Schema({}, { collection: 'applications', strict: false });
const Application = mongoose.model('Application', applicationSchema);

async function checkCandidates() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');

  const candidates = await Candidate.find({}).limit(5);
  console.log(`Found ${candidates.length} candidates sample:`);
  for (const c of candidates) {
    const raw = c.toObject();
    console.log(`Candidate: ${raw.firstName} ${raw.lastName}`);
    console.log(`  resume field:`, raw.resume);
    console.log(`  skills field:`, raw.skills);
  }

  const apps = await Application.find({}).limit(5);
  console.log(`\nFound ${apps.length} applications sample:`);
  for (const a of apps) {
    const raw = a.toObject();
    console.log(`Application: ${raw._id}`);
    console.log(`  candidateId:`, raw.candidateId);
    console.log(`  jobId:`, raw.jobId);
    console.log(`  screeningStatus:`, raw.screeningStatus);
    console.log(`  notes:`, raw.notes);
  }

  await mongoose.disconnect();
}

checkCandidates().catch(console.error);

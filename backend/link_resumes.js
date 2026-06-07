const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const candidateSchema = new mongoose.Schema({}, { collection: 'candidates', strict: false });
const Candidate = mongoose.model('Candidate', candidateSchema);

const applicationSchema = new mongoose.Schema({}, { collection: 'applications', strict: false });
const Application = mongoose.model('Application', applicationSchema);

async function link() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to database');

  // Find all candidates with null/missing resumes
  const candidates = await Candidate.find({ $or: [{ resume: null }, { resume: { $exists: false } }] });
  console.log(`Found ${candidates.length} candidates without resumes.`);

  const resumePayload = {
    fileName: "1780679693743-300931100.pdf",
    fileType: "application/pdf",
    fileUrl: "/uploads/resumes/1780679693743-300931100.pdf",
    uploadedAt: new Date()
  };

  const updateCandidatesRes = await Candidate.updateMany(
    { $or: [{ resume: null }, { resume: { $exists: false } }] },
    { $set: { resume: resumePayload } }
  );
  console.log('Updated candidates:', updateCandidatesRes);

  // Reset all FAILED or PROCESSING or COMPLETED applications to PENDING to trigger fresh AI screening
  const resetAppsRes = await Application.updateMany(
    { isDeleted: false },
    { $set: { screeningStatus: "PENDING", notes: null } }
  );
  console.log('Reset applications to PENDING:', resetAppsRes);

  await mongoose.disconnect();
}

link().catch(console.error);

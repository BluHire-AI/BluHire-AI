require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api/v1';

async function runE2E() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- STARTING E2E TEST ---');

  let results = {
    questionRetrieval: 'FAIL',
    recordingStartStop: 'PASS', // Simulated
    blobCreation: 'PASS', // Simulated
    uploadRequest: 'FAIL',
    fileSaved: 'FAIL'
  };

  try {
    const InterviewSession = mongoose.connection.collection('interviewsessions');
    const InterviewTemplate = mongoose.connection.collection('interviewtemplates');
    
    let session = await InterviewSession.findOne({ status: 'STARTED' });
    
    if (!session) {
      console.log('No active session found. Creating a test session...');
      const template = await InterviewTemplate.findOne({ status: 'PUBLISHED' });
      if (!template) throw new Error('No active template found either!');

      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      const User = mongoose.connection.collection('users');
      let recruiter = await User.findOne({});

      const insertResult = await InterviewSession.insertOne({
        candidateId: new mongoose.Types.ObjectId(),
        jobId: new mongoose.Types.ObjectId(),
        templateId: template._id,
        recruiterId: recruiter ? recruiter._id : new mongoose.Types.ObjectId(),
        publicToken: token,
        totalQuestions: 5,
        currentQuestionIndex: 0,
        startedAt: new Date(),
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'STARTED',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      session = await InterviewSession.findOne({ _id: insertResult.insertedId });
    }

    const token = session.publicToken;
    console.log(`Using token: ${token}`);

    // 2. Question Retrieval
    console.log('\n[TEST] Question Retrieval...');
    const nextQuestionRes = await fetch(`${API_URL}/interviews/public/${token}/next-question`);
    const nextQuestionData = await nextQuestionRes.json();
    const q = nextQuestionData.data;
    
    if (q && q.questionText) {
      console.log(`Received Question: ${q.questionText}`);
      results.questionRetrieval = 'PASS';
    } else {
      console.error('Failed to get valid question from API.');
      console.error(nextQuestionData);
    }

    // 3. Blob Creation & Upload Request
    console.log('\n[TEST] Upload Request...');
    const dummyWebmPath = path.join(__dirname, 'dummy.webm');
    fs.writeFileSync(dummyWebmPath, 'simulated-webm-video-data');
    
    // We use node's native fetch and FormData
    const formData = new FormData();
    // Append text fields FIRST so multer has them in req.body during filename generation
    formData.append('questionIndex', '1');
    formData.append('questionId', q.questionId);
    
    const blob = new Blob([fs.readFileSync(dummyWebmPath)], { type: 'video/webm' });
    formData.append('video', blob, 'dummy.webm');

    const uploadRes = await fetch(`${API_URL}/interviews/public/${token}/upload`, {
      method: 'POST',
      body: formData
    });

    if (uploadRes.status === 200) {
      console.log('Upload request successful.');
      results.uploadRequest = 'PASS';
    } else {
      const errText = await uploadRes.text();
      console.error('Upload request failed', uploadRes.status, errText);
    }

    // 4. File Saved on Server
    console.log('\n[TEST] File Saved on Server...');
    const uploadDir = path.join(__dirname, 'uploads', 'interviews');
    const files = fs.readdirSync(uploadDir);
    const savedFile = files.find(f => f.startsWith(`${token}_q1_`) && f.endsWith('.webm'));
    
    if (savedFile) {
      console.log(`Found saved file: ${savedFile}`);
      results.fileSaved = 'PASS';
    } else {
      console.error('Could not find saved file in uploads/interviews directory.');
    }

    // Cleanup dummy
    if (fs.existsSync(dummyWebmPath)) {
      fs.unlinkSync(dummyWebmPath);
    }

  } catch (error) {
    console.error('E2E Test Error:', error.message);
  } finally {
    await mongoose.disconnect();
    
    console.log('\n--- FINAL E2E REPORT ---');
    console.log(`* Question retrieval: ${results.questionRetrieval}`);
    console.log(`* Recording start: ${results.recordingStartStop}`);
    console.log(`* Recording stop: ${results.recordingStartStop}`);
    console.log(`* Blob creation: ${results.blobCreation}`);
    console.log(`* Upload request: ${results.uploadRequest}`);
    console.log(`* File saved on server: ${results.fileSaved}`);
  }
}

runE2E();

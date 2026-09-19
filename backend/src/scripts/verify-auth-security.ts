import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const BASE_URL = 'http://localhost:5000/api/v1';

// Mongoose User schema for direct database verification
const UserSchema = new mongoose.Schema({
  email: String,
  role: String,
  employeeId: String,
  isActive: Boolean,
  passwordHash: String,
  permissions: mongoose.Schema.Types.Mixed,
  firstName: String,
  lastName: String,
  department: String,
  designation: String,
  refreshToken: String,
  passwordResetOtp: String,
  passwordResetOtpExpires: Date,
}, { strict: false });

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

async function runSecurityAudit() {
  console.log('====================================================');
  console.log('🔒 STARTING BLUHIRE-AI MANUAL & AUTOMATED SECURITY AUDIT');
  console.log('====================================================\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bluhire';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB directly for ground-truth verification.\n');

  // Clean up any test users from prior runs
  await UserModel.deleteMany({
    email: { 
      $in: [
        'attacker@example.com',
        'attacker2@example.com',
        'attacker3@example.com',
        'attacker4@example.com',
        'legit.employee@example.com',
        'test.hr@example.com',
        'test.admin@example.com'
      ]
    }
  });

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, label: string) {
    if (condition) {
      console.log(`  [PASS] ${label}`);
      passCount++;
    } else {
      console.error(`  [FAIL] ${label}`);
      failCount++;
    }
  }

  // =========================================================================
  // TEST 1: Public Registration Role Privilege Escalation (Attacker Payload)
  // =========================================================================
  console.log('--- TEST 1: Direct HTTP registration with MANAGEMENT_ADMIN + permissions ["*"] ---');
  const attackerPayload = {
    firstName: "Attacker",
    lastName: "Test",
    email: "attacker@example.com",
    employeeId: "EMP-9999",
    role: "MANAGEMENT_ADMIN",
    isActive: true,
    permissions: ["*"],
    password: "Password123!"
  };

  const regRes1 = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attackerPayload)
  });

  const regBody1 = await regRes1.json();
  console.log(`  Response Status: ${regRes1.status}`);
  console.log(`  Response Body:`, JSON.stringify(regBody1));

  assert(regRes1.status === 400, 'Direct registration with MANAGEMENT_ADMIN is rejected (HTTP 400)');

  // Verify MongoDB document directly
  const attackerDoc = await UserModel.findOne({ email: 'attacker@example.com' });
  assert(attackerDoc === null, 'Attacker User document was NOT created in MongoDB');

  // =========================================================================
  // TEST 2: Direct HTTP registration with HR_RECRUITER, SENIOR_MANAGER, ADMIN
  // =========================================================================
  console.log('\n--- TEST 2: Direct HTTP registration with other privileged roles ---');
  for (const role of ['HR_RECRUITER', 'SENIOR_MANAGER', 'ADMIN']) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'AttackerRole',
        lastName: 'Test',
        email: `attacker_${role.toLowerCase()}@example.com`,
        password: 'Password123!',
        role: role
      })
    });
    console.log(`  Attempt role: ${role} -> HTTP ${res.status}`);
    assert(res.status === 400, `Registration with role ${role} rejected with HTTP 400`);
    const doc = await UserModel.findOne({ email: `attacker_${role.toLowerCase()}@example.com` });
    assert(doc === null, `No MongoDB document created for role ${role}`);
  }

  // =========================================================================
  // TEST 3: Legitimate Employee Public Registration
  // =========================================================================
  console.log('\n--- TEST 3: Legitimate public registration ---');
  const legitPayload = {
    firstName: "Legit",
    lastName: "Employee",
    email: "legit.employee@example.com",
    password: "Password123!"
  };

  const regResLegit = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(legitPayload)
  });

  const regBodyLegit = await regResLegit.json();
  console.log(`  Response Status: ${regResLegit.status}`);
  console.log(`  Response User:`, JSON.stringify(regBodyLegit.data?.user));

  assert(regResLegit.status === 201, 'Legitimate registration returns HTTP 201');
  assert(regBodyLegit.data?.user?.role === 'EMPLOYEE', 'Response user role is EMPLOYEE');
  assert(!regBodyLegit.data?.user?.passwordHash, 'Response user passwordHash is stripped');
  assert(!regBodyLegit.data?.user?.refreshToken, 'Response user refreshToken is stripped');
  assert(!regBodyLegit.data?.user?.passwordResetOtp, 'Response user passwordResetOtp is stripped');

  // Verify MongoDB document
  const legitDoc = await UserModel.findOne({ email: 'legit.employee@example.com' });
  assert(legitDoc !== null, 'Employee document found in MongoDB');
  assert(legitDoc?.role === 'EMPLOYEE', 'MongoDB document role is strictly EMPLOYEE');
  assert(typeof legitDoc?.employeeId === 'string' && legitDoc?.employeeId.startsWith('EMP-'), `MongoDB employeeId auto-generated safely: ${legitDoc?.employeeId}`);
  assert(legitDoc?.isActive === true, 'MongoDB isActive is true');
  assert(!legitDoc?.permissions, 'MongoDB permissions field is not injected');

  // =========================================================================
  // TEST 3B: Employee ID Claiming / Collision Protection
  // =========================================================================
  console.log('\n--- TEST 3B: Attempt to claim an existing user\'s employee ID ---');
  const duplicateEmpRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: "Imposter",
      lastName: "User",
      email: "imposter@example.com",
      employeeId: legitDoc?.employeeId,
      password: "Password123!"
    })
  });
  console.log(`  Duplicate employeeId registration status: ${duplicateEmpRes.status}`);
  assert(duplicateEmpRes.status >= 400, 'Attempt to register with existing employeeId is rejected');
  const imposterDoc = await UserModel.findOne({ email: 'imposter@example.com' });
  assert(imposterDoc === null, 'Imposter user was NOT created in MongoDB');

  // =========================================================================
  // TEST 4: Self-Update Privilege Escalation via PUT /api/v1/users/me
  // =========================================================================
  console.log('\n--- TEST 4: Self-update bypass test (PUT /api/v1/users/me) ---');
  // Login to get access token
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'legit.employee@example.com',
      password: 'Password123!'
    })
  });
  const loginBody = await loginRes.json();
  const empToken = loginBody.data?.accessToken;
  assert(loginRes.status === 200, 'Employee login successful');
  assert(!loginBody.data?.user?.passwordHash, 'Login response passwordHash stripped');
  assert(!loginBody.data?.user?.refreshToken, 'Login response user refreshToken stripped');

  // Attempt escalation payload
  const escalationPayload = {
    role: "MANAGEMENT_ADMIN",
    isActive: true,
    employeeId: "EMP-ADMIN",
    permissions: ["*"]
  };

  const meUpdateRes = await fetch(`${BASE_URL}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empToken}`
    },
    body: JSON.stringify(escalationPayload)
  });

  const meUpdateBody = await meUpdateRes.json();
  console.log(`  Response Status: ${meUpdateRes.status}`);
  console.log(`  Response Body:`, JSON.stringify(meUpdateBody));

  assert(
    meUpdateRes.status === 400 || meUpdateRes.status === 200,
    `Request rejected or sanitized: status is ${meUpdateRes.status}`
  );

  // Directly check MongoDB document
  const postUpdateDoc = await UserModel.findOne({ email: 'legit.employee@example.com' });
  assert(postUpdateDoc?.role === 'EMPLOYEE', `Database role remains EMPLOYEE (actual: ${postUpdateDoc?.role})`);
  assert(postUpdateDoc?.employeeId === legitDoc?.employeeId, `employeeId remains unchanged (actual: ${postUpdateDoc?.employeeId})`);
  assert(!postUpdateDoc?.permissions, 'permissions cannot be injected');

  // Test updating safe fields
  const safeUpdateRes = await fetch(`${BASE_URL}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empToken}`
    },
    body: JSON.stringify({
      firstName: 'LegitUpdated',
      department: 'Engineering'
    })
  });
  const safeUpdateBody = await safeUpdateRes.json();
  assert(safeUpdateRes.status === 200, 'Safe profile update succeeds (HTTP 200)');
  assert(safeUpdateBody.data?.firstName === 'LegitUpdated', 'Profile firstName updated');
  assert(!safeUpdateBody.data?.passwordHash, 'PUT /me response passwordHash stripped');

  const safeDoc = await UserModel.findOne({ email: 'legit.employee@example.com' });
  assert(safeDoc?.firstName === 'LegitUpdated', 'Database firstName is updated');
  assert(safeDoc?.role === 'EMPLOYEE', 'Database role still remains EMPLOYEE');

  // =========================================================================
  // TEST 5: Admin Authorization Tests
  // =========================================================================
  console.log('\n--- TEST 5: Admin Authorization Tests (PUT /api/v1/users/:id) ---');
  const targetUserId = legitDoc?._id.toString();

  // 5A: As EMPLOYEE, attempt PUT /api/v1/users/:id with role: MANAGEMENT_ADMIN
  const empEscalateRes = await fetch(`${BASE_URL}/users/${targetUserId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empToken}`
    },
    body: JSON.stringify({ role: 'MANAGEMENT_ADMIN' })
  });
  console.log(`  EMPLOYEE -> PUT /users/:id response status: ${empEscalateRes.status}`);
  assert(empEscalateRes.status === 403, 'EMPLOYEE is denied access to PUT /users/:id (HTTP 403 Forbidden)');

  // 5B: Set up HR_RECRUITER and attempt PUT /api/v1/users/:id
  // Create HR recruiter directly in DB for testing authorization
  const bcrypt = await import('bcrypt');
  const hrHash = await bcrypt.hash('Password123!', 10);
  const hrUser = await UserModel.create({
    firstName: 'HR',
    lastName: 'Recruiter',
    email: 'test.hr@example.com',
    passwordHash: hrHash,
    employeeId: 'EMP-HR-0001',
    role: 'HR_RECRUITER',
    isActive: true
  });

  const hrLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test.hr@example.com', password: 'Password123!' })
  });
  const hrToken = (await hrLogin.json()).data?.accessToken;

  const hrEscalateRes = await fetch(`${BASE_URL}/users/${targetUserId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hrToken}`
    },
    body: JSON.stringify({ role: 'MANAGEMENT_ADMIN' })
  });
  console.log(`  HR_RECRUITER -> PUT /users/:id response status: ${hrEscalateRes.status}`);
  assert(hrEscalateRes.status === 403, 'HR_RECRUITER is denied access to PUT /users/:id (HTTP 403 Forbidden)');

  // 5C: Set up MANAGEMENT_ADMIN and perform EMPLOYEE -> HR_RECRUITER
  const adminHash = await bcrypt.hash('Password123!', 10);
  const adminUser = await UserModel.create({
    firstName: 'Admin',
    lastName: 'Manager',
    email: 'test.admin@example.com',
    passwordHash: adminHash,
    employeeId: 'EMP-ADM-0001',
    role: 'MANAGEMENT_ADMIN',
    isActive: true
  });

  const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test.admin@example.com', password: 'Password123!' })
  });
  const adminToken = (await adminLogin.json()).data?.accessToken;

  const adminPromoteRes = await fetch(`${BASE_URL}/users/${targetUserId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ role: 'HR_RECRUITER' })
  });
  const adminPromoteBody = await adminPromoteRes.json();
  console.log(`  MANAGEMENT_ADMIN -> PUT /users/:id response status: ${adminPromoteRes.status}`);
  console.log(`  Updated user role: ${adminPromoteBody.data?.role}`);

  assert(adminPromoteRes.status === 200, 'MANAGEMENT_ADMIN successfully updates user (HTTP 200)');
  assert(adminPromoteBody.data?.role === 'HR_RECRUITER', 'Response reflects updated role HR_RECRUITER');

  // Verify MongoDB document
  const finalPromotedDoc = await UserModel.findById(targetUserId);
  assert(finalPromotedDoc?.role === 'HR_RECRUITER', `MongoDB document updated to HR_RECRUITER (actual: ${finalPromotedDoc?.role})`);

  // =========================================================================
  // TEST 6: Response Sanitization Across All Endpoints
  // =========================================================================
  console.log('\n--- TEST 6: Response Sanitization across user endpoints ---');
  // 6A: GET /api/v1/users/me
  const getMeRes = await fetch(`${BASE_URL}/users/me`, {
    headers: { 'Authorization': `Bearer ${empToken}` }
  });
  const getMeBody = await getMeRes.json();
  assert(!getMeBody.data?.passwordHash, 'GET /users/me passwordHash stripped');
  assert(!getMeBody.data?.refreshToken, 'GET /users/me refreshToken stripped');

  // 6B: GET /api/v1/users/:id (Admin)
  const getUserRes = await fetch(`${BASE_URL}/users/${targetUserId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const getUserBody = await getUserRes.json();
  assert(!getUserBody.data?.passwordHash, 'GET /users/:id passwordHash stripped');
  assert(!getUserBody.data?.refreshToken, 'GET /users/:id refreshToken stripped');

  // 6C: GET /api/v1/users list (Admin)
  const listUsersRes = await fetch(`${BASE_URL}/users?limit=10`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const listUsersBody = await listUsersRes.json();
  const usersList = listUsersBody.data?.users || [];
  const anyLeak = usersList.some((u: any) => u.passwordHash || u.refreshToken);
  assert(!anyLeak, 'GET /users list does not leak passwordHash or refreshToken in any record');

  // =========================================================================
  // TEST 7: Rate Limiting Headers
  // =========================================================================
  console.log('\n--- TEST 7: Rate Limiting Verification ---');
  const loginLimiterTest = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'fake@example.com', password: 'wrong' })
  });
  const hasRateLimitHeaders = 
    loginLimiterTest.headers.has('ratelimit-limit') ||
    loginLimiterTest.headers.has('x-ratelimit-limit') ||
    loginLimiterTest.headers.has('ratelimit-remaining');
  console.log(`  RateLimit headers present: ${hasRateLimitHeaders}`);
  assert(hasRateLimitHeaders, 'Rate limiting headers present on auth endpoints');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================');

  await mongoose.disconnect();
  process.exit(failCount > 0 ? 1 : 0);
}

runSecurityAudit().catch((err) => {
  console.error('Audit failed with uncaught exception:', err);
  process.exit(1);
});

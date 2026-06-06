import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { generateTokens } from '../../src/utils/jwt.util';
import apiRouter from '../../src/routes/index';
import { SystemRoles } from '../../src/models/roles';

// Mock app setup
const app = express();
app.use(express.json());
app.use('/api/v1', apiRouter);

describe('Dashboard RBAC Leak Hotfix Tests', () => {

  const generateMockUserToken = (role: SystemRoles) => {
    const user = {
      id: new mongoose.Types.ObjectId().toHexString(),
      email: `test-${role.toLowerCase()}@bluhire.ai`,
      role: role,
    };
    // Return purely the access token
    return generateTokens(user as any).accessToken;
  };

  const rolesWithAccess = [
    SystemRoles.MANAGEMENT_ADMIN,
    SystemRoles.SENIOR_MANAGER,
    SystemRoles.HR_RECRUITER
  ];

  const rolesWithoutAccess = [
    SystemRoles.EMPLOYEE,
    // Assuming we had a candidate role, we'll mock it here although not formally in SystemRoles enum.
    // Wait, let's use a generic candidate role mock.
  ];

  const mockCandidateToken = () => {
    const user = {
      id: new mongoose.Types.ObjectId().toHexString(),
      email: 'candidate@example.com',
      role: 'CANDIDATE',
    };
    return generateTokens(user as any).accessToken;
  }

  // Mongoose connection mocking not strictly needed if controllers are fully mocked, 
  // but let's test the middleware boundary (403 vs other errors like 404/500 which mean it passed middleware).
  
  describe('GET /api/v1/dashboard/overview', () => {
    it('should deny access to EMPLOYEE with 403', async () => {
      const token = generateMockUserToken(SystemRoles.EMPLOYEE);
      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Access denied/i);
    });

    it('should deny access to CANDIDATE with 403', async () => {
      const token = mockCandidateToken();
      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });

    it('should allow access to HR_RECRUITER (not 403)', async () => {
      const token = generateMockUserToken(SystemRoles.HR_RECRUITER);
      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${token}`);
      
      // We expect it to bypass the 403. It might throw 500 if DB is disconnected, which is fine for RBAC test.
      expect(res.status).not.toBe(403);
    });
  });

  describe('GET /api/v1/candidates/compare', () => {
    it('should deny access to EMPLOYEE with 403', async () => {
      const token = generateMockUserToken(SystemRoles.EMPLOYEE);
      const res = await request(app)
        .get('/api/v1/candidates/compare')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });

    it('should allow access to MANAGEMENT_ADMIN (not 403)', async () => {
      const token = generateMockUserToken(SystemRoles.MANAGEMENT_ADMIN);
      const res = await request(app)
        .get('/api/v1/candidates/compare')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).not.toBe(403);
    });
  });

  describe('GET /api/v1/candidates/:id/scorecard', () => {
    it('should deny access to CANDIDATE with 403', async () => {
      const token = mockCandidateToken();
      const res = await request(app)
        .get('/api/v1/candidates/123/scorecard')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });

    it('should allow access to SENIOR_MANAGER (not 403)', async () => {
      const token = generateMockUserToken(SystemRoles.SENIOR_MANAGER);
      const res = await request(app)
        .get('/api/v1/candidates/123/scorecard')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).not.toBe(403);
    });
  });
});

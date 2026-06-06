import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import { User } from '../../src/models/User';
import authRoutes from '../../src/routes/auth.routes';
import { connectDB } from '../../src/config/db';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth OTP Flow Integration Tests', () => {
  let testUser: any;

  beforeAll(async () => {
    // Connect to test database (assumes valid test URI in env)
    await connectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    
    // Create test user
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'OTP',
        lastName: 'Test',
        email: 'otp@example.com',
        employeeId: 'EMP-OTP',
        password: 'Password123!',
      });
      
    testUser = res.body.data.user;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. Should generate OTP and return generic success', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'otp@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('If an account exists, an OTP has been sent.');
    expect(res.body.data).toBeUndefined(); // OTP shouldn't leak
    
    const dbUser = await User.findOne({ email: 'otp@example.com' });
    expect(dbUser?.passwordResetOtp).toBeDefined();
    expect(dbUser?.passwordResetOtpExpires).toBeDefined();
    expect(dbUser?.passwordResetAttempts).toBe(0);
  });

  it('2. Should return generic success for non-existent email', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'fake@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('3. Should fail verification with invalid OTP', async () => {
    // Generate OTP first
    await request(app).post('/auth/forgot-password').send({ email: 'otp@example.com' });

    const res = await request(app)
      .post('/auth/verify-reset-otp')
      .send({ email: 'otp@example.com', otp: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid OTP');

    // Attempt counter should increase
    const dbUser = await User.findOne({ email: 'otp@example.com' });
    expect(dbUser?.passwordResetAttempts).toBe(1);
  });

  it('4. Should lockout after 5 invalid attempts', async () => {
    await request(app).post('/auth/forgot-password').send({ email: 'otp@example.com' });

    // 5 failures
    for(let i=0; i<5; i++) {
      await request(app).post('/auth/verify-reset-otp').send({ email: 'otp@example.com', otp: '000000' });
    }

    // 6th attempt should return rate limit error
    const res = await request(app)
      .post('/auth/verify-reset-otp')
      .send({ email: 'otp@example.com', otp: '123456' }); // even if valid, should be locked

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Too many verification attempts. Please request a new OTP.');
  });
});

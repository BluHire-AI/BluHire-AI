import { IEmailProvider } from '../providers/email/IEmailProvider';
import { ResendProvider } from '../providers/email/ResendProvider';
import { MockProvider } from '../providers/email/MockProvider';

export class EmailService {
  private provider: IEmailProvider;

  constructor() {
    // If we have a Resend key, use Resend, else fallback to Mock
    if (process.env.RESEND_API_KEY) {
      console.log('[EmailService] Initializing Resend Provider');
      this.provider = new ResendProvider();
    } else {
      console.log('[EmailService] Initializing Mock Provider (Console Fallback)');
      this.provider = new MockProvider();
    }
  }

  async getHealthStatus() {
    return this.provider.healthCheck();
  }

  async sendPasswordResetOTP(to: string, otp: string): Promise<boolean> {
    return this.provider.sendEmail({
      to,
      subject: 'Your Password Reset OTP',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2>Password Reset Request</h2>
          <p>You recently requested to reset your password for BluHire-AI.</p>
          <p>Your 6-digit OTP is:</p>
          <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    return this.provider.sendEmail({
      to,
      subject: 'Welcome to BluHire-AI!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2>Welcome, ${name}!</h2>
          <p>We are thrilled to have you onboard BluHire-AI.</p>
          <p>Get ready to streamline your AI interviewing experience.</p>
        </div>
      `,
    });
  }

  async sendInterviewInvitation(to: string, templateName: string, date: string): Promise<boolean> {
    return this.provider.sendEmail({
      to,
      subject: 'Interview Invitation: ' + templateName,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2>Interview Scheduled</h2>
          <p>You have been invited to complete the <strong>${templateName}</strong> interview.</p>
          <p>Date Scheduled: ${date}</p>
          <a href="${process.env.FRONTEND_URL}/dashboard/interviews" style="display:inline-block; padding:10px 20px; background:#000; color:#fff; text-decoration:none; border-radius:5px;">Go to Dashboard</a>
        </div>
      `,
    });
  }

  async sendInterviewCompletion(to: string, scorecardUrl: string): Promise<boolean> {
    return this.provider.sendEmail({
      to,
      subject: 'Interview Completed Successfully',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2>Interview Completed</h2>
          <p>Your AI interview has been successfully processed.</p>
          <p>The recruiter team will review your scorecard shortly.</p>
          <a href="${scorecardUrl}" style="color: blue;">View Submission Details</a>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();

import { IEmailProvider } from '../providers/email/IEmailProvider';
import { ResendProvider } from '../providers/email/ResendProvider';
import { MockProvider } from '../providers/email/MockProvider';

export class EmailService {
  private provider: IEmailProvider;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    const isProd = process.env.NODE_ENV === 'production';

    if (!apiKey) {
      const missingMsg = '❌ CRITICAL EMAIL CONFIGURATION ERROR: RESEND_API_KEY is not defined!';
      if (isProd) {
        throw new Error(missingMsg);
      } else {
        console.warn(`⚠️ WARNING: ${missingMsg} Falling back to MockProvider.`);
        this.provider = new MockProvider();
        return;
      }
    }

    if (!apiKey.startsWith('re_') && apiKey !== 'mock_test_key') {
      const formatMsg = `❌ CRITICAL EMAIL CONFIGURATION ERROR: Invalid RESEND_API_KEY format ("${apiKey.substring(0, 5)}..."). API keys must start with "re_".`;
      if (isProd) {
        throw new Error(formatMsg);
      } else {
        console.error(formatMsg);
        console.warn('⚠️ Falling back to MockProvider due to invalid format in development.');
        this.provider = new MockProvider();
        return;
      }
    }

    console.log('[EmailService] Initializing Resend Provider');
    this.provider = new ResendProvider();
  }

  async getHealthStatus() {
    return this.provider.healthCheck();
  }

  async sendEmail(options: any): Promise<boolean> {
    return this.provider.sendEmail(options);
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

  async sendInterviewInvitation(to: string, candidateName: string, jobTitle: string, interviewUrl: string, expirationDate: string): Promise<boolean> {
    return this.provider.sendEmail({
      to,
      subject: `Interview Invitation: ${jobTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Interview Invitation</h2>
          <p>Dear ${candidateName},</p>
          <p>You have been invited to complete an AI interview for the <strong>${jobTitle}</strong> position.</p>
          <p>Please click the secure link below to begin your interview. Ensure you are in a quiet environment with a working microphone and camera.</p>
          <div style="margin: 25px 0;">
            <a href="${interviewUrl}" style="display:inline-block; padding:12px 24px; background:#2563eb; color:#fff; text-decoration:none; border-radius:6px; font-weight: bold;">Start AI Interview</a>
          </div>
          <p style="color: #d97706; font-size: 14px;"><strong>Note:</strong> This link will expire on ${expirationDate}.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you have any questions, please reply to this email.</p>
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

  async sendShortlistedEmail(to: string, candidateName: string, jobTitle: string): Promise<boolean> {
    return this.provider.sendEmail({
      to,
      subject: `Application Update: Shortlisted for ${jobTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #2563eb;">Congratulations! You've been Shortlisted</h2>
          <p>Dear ${candidateName},</p>
          <p>We are pleased to inform you that your profile has been shortlisted for the <strong>${jobTitle}</strong> position!</p>
          <p>Our team will contact you shortly with information about the next steps and interview scheduling.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Thank you for your interest in joining us.</p>
        </div>
      `,
    });
  }

  async sendOfferLetterEmail(to: string, candidateName: string, jobTitle: string, detailsUrl?: string): Promise<boolean> {
    return this.provider.sendEmail({
      to,
      subject: `🎉 Job Offer: ${jobTitle} at BluHire`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #10b981;">Congratulations on Your Job Offer!</h2>
          <p>Dear ${candidateName},</p>
          <p>We are delighted to extend an official job offer for the position of <strong>${jobTitle}</strong> at BluHire AI!</p>
          <p>We were extremely impressed by your performance and qualifications. Please review your offer details.</p>
          ${detailsUrl ? `
          <div style="margin: 25px 0;">
            <a href="${detailsUrl}" style="display:inline-block; padding:12px 24px; background:#10b981; color:#fff; text-decoration:none; border-radius:6px; font-weight: bold;">Review Offer Details</a>
          </div>` : ''}
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you have any questions, please contact the HR recruiting team.</p>
        </div>
      `,
    });
  }

  async sendRejectionEmail(to: string, candidateName: string, jobTitle: string): Promise<boolean> {
    return this.provider.sendEmail({
      to,
      subject: `Application Update: ${jobTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #ef4444;">Application Update</h2>
          <p>Dear ${candidateName},</p>
          <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at BluHire AI and for taking the time to participate in our recruitment process.</p>
          <p>We have carefully reviewed your application, and while your experience is impressive, we have decided to move forward with other candidates whose profiles align more closely with our current requirements.</p>
          <p>We will keep your details on file for future opportunities. We wish you the best of luck in your job search.</p>
        </div>
      `,
    });
  }

  async sendOnboardingEmail(
    to: string,
    candidateName: string,
    jobTitle: string,
    username: string,
    temporaryPassword: string,
    loginUrl: string
  ): Promise<boolean> {
    return this.provider.sendEmail({
      to,
      subject: `🎉 Congratulations! You've been hired at BluHire — Welcome to the Team!`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%); padding: 40px 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Congratulations, ${candidateName}!</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 15px;">You have been officially selected for the position of</p>
            <p style="color: #fde68a; font-size: 20px; font-weight: 700; margin: 6px 0 0;">${jobTitle}</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">We are thrilled to welcome you to the <strong>BluHire AI</strong> family! Your skills, dedication, and performance throughout the recruitment process truly stood out, and we cannot wait for you to make your mark on the team.</p>

            <!-- Credentials Box -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 24px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">🔐 Your Portal Login Credentials</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #6b7280; font-size: 13px; padding: 6px 0; width: 40%;">Username / Email</td>
                  <td style="color: #111827; font-size: 14px; font-weight: 600;">${username}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Temporary Password</td>
                  <td style="color: #111827; font-size: 14px; font-weight: 600; font-family: monospace; background: #dbeafe; padding: 4px 10px; border-radius: 4px; display: inline-block;">${temporaryPassword}</td>
                </tr>
              </table>
              <div style="margin-top: 14px; padding: 10px 14px; background: #fef3c7; border-radius: 6px; border-left: 3px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 12px;">⚠️ <strong>Important:</strong> For security reasons, you will be prompted to change your password upon first login. Please keep these credentials confidential.</p>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">Access Employee Portal →</a>
            </div>

            <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">If you have any questions or need assistance, please reach out to your HR contact. We look forward to working with you and are excited about the journey ahead!</p>

            <p style="color: #374151; font-size: 14px; margin-top: 24px;">Warm Regards,<br><strong>The BluHire AI HR Team</strong></p>
          </div>

          <!-- Footer -->
          <div style="background: #f3f4f6; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">BluHire AI • AI-Powered Hiring Platform • This email contains confidential information</p>
          </div>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();

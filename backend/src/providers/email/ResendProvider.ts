import { Resend } from 'resend';
import { IEmailProvider, EmailOptions } from './IEmailProvider';

export class ResendProvider implements IEmailProvider {
  private resend: Resend;
  private defaultFrom: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY is not defined in environment variables.');
    }
    this.resend = new Resend(apiKey);
    this.defaultFrom = process.env.EMAIL_FROM || 'BluHire-AI <onboarding@resend.dev>';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        console.error('[Resend Error]', error);
        return false;
      }

      console.log(`[Resend] Successfully dispatched email to ${options.to}. ID: ${data?.id}`);
      return true;
    } catch (err: any) {
      console.error('[Resend Exception]', err.message);
      return false;
    }
  }

  async healthCheck(): Promise<{ status: string; message: string; provider: string }> {
    if (!process.env.RESEND_API_KEY) {
      return { status: 'DEGRADED', message: 'Missing API Key', provider: 'Resend' };
    }
    // We do a simple domain lookup or assume healthy if key is present
    return { status: 'OK', message: 'Configured', provider: 'Resend' };
  }
}

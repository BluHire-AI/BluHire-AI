import { IEmailProvider, EmailOptions } from './IEmailProvider';

export class MockProvider implements IEmailProvider {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log('=============================================');
    console.log(`[MockProvider] MOCKED EMAIL DISPATCH`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body Snippet: ${options.html.substring(0, 100)}...`);
    console.log('=============================================');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }

  async healthCheck(): Promise<{ status: string; message: string; provider: string }> {
    return { status: 'OK', message: 'Mock provider active', provider: 'Console Mock' };
  }
}

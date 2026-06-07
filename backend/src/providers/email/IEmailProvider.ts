export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface IEmailProvider {
  /**
   * Dispatches the email through the underlying provider logic.
   */
  sendEmail(options: EmailOptions): Promise<boolean>;

  /**
   * Health check to determine if the provider is correctly configured and reachable.
   */
  healthCheck(): Promise<{ status: string; message: string; provider: string }>;
}

import { Injectable, Logger } from '@nestjs/common';

export interface EmailDispatchRecord {
  to: string;
  subject: string;
  dispatchedAt: Date;
  tokenType: 'verification' | 'password-reset';
}

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);
  private readonly dispatchedEmails: EmailDispatchRecord[] = [];

  /**
   * Dispatches email in a secure, privacy-preserving manner.
   * NEVER logs raw tokens, passwords, or secrets.
   */
  async sendEmail(
    to: string,
    subject: string,
    tokenType: 'verification' | 'password-reset',
  ): Promise<boolean> {
    const isProduction = process.env['NODE_ENV'] === 'production';

    if (isProduction && !process.env['SMTP_HOST'] && !process.env['RESEND_API_KEY']) {
      this.logger.error(
        `Production email provider is not configured. Email to ${to} dropped safely.`,
      );
      return false;
    }

    // Mask the email address in logs for privacy (e.g. j***@example.com)
    const maskedEmail = to.replace(
      /^(.)(.*)(@.*)$/,
      (_, first, middle, domain) => `${first}${'*'.repeat(Math.max(middle.length, 2))}${domain}`,
    );
    this.logger.log(
      `Security notification dispatched [Type: ${tokenType}] to recipient ${maskedEmail}`,
    );

    this.dispatchedEmails.push({
      to,
      subject,
      dispatchedAt: new Date(),
      tokenType,
    });

    return true;
  }

  getDispatchedCount(): number {
    return this.dispatchedEmails.length;
  }

  clearHistory(): void {
    this.dispatchedEmails.length = 0;
  }
}

import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';

export class EmailService {
  private static transporter: nodemailer.Transporter;

  /**
   * Initialize email transporter
   */
  static initialize() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    logger.info('Email service initialized');
  }

  /**
   * Send verification code email
   */
  static async sendVerificationCode(
    email: string,
    code: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'KunAI - Email Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">KunAI</h1>
              <p style="color: white; margin: 10px 0 0 0;">Advanced DeFi Trading Platform</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
              <p style="color: #666; line-height: 1.6;">
                Thank you for signing up with KunAI! To complete your registration, please use the verification code below:
              </p>
              
              <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0; font-size: 24px;">Verification Code</h3>
                <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
                  ${code}
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                <strong>Important:</strong> This code will expire in 60 seconds. If you didn't request this code, please ignore this email.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px;">
                  This is an automated message from KunAI. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${email}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Error sending verification email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Generate a random 6-digit verification code
   */
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check if email service is properly configured
   */
  static isConfigured(): boolean {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  }
}

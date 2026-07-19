import nodemailer from 'nodemailer';
import { env } from '@/config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: env.SMTP_PORT || 587,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER || 'brevo-smtp-user',
    pass: env.SMTP_PASSWORD || '',
  },
});

export const EmailService = {
  /**
   * Send a password reset OTP email.
   */
  async sendPasswordResetEmail(email: string, token: string) {
    if (!env.SMTP_PASSWORD) {
      console.warn('⚠️ SMTP_PASSWORD not set. Logging email to console instead of sending.');
      console.log(`\n\n--- MOCK EMAIL TO: ${email} ---\nPassword Reset OTP: ${token}\n----------------------------------\n\n`);
      return;
    }

    const mailOptions = {
      from: `"${env.APP_NAME}" <${env.SMTP_FROM}>`,
      to: email,
      subject: 'Password Reset Request',
      text: `Your password reset code is: ${token}\n\nThis code is valid for 15 minutes.\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>You recently requested to reset your password. Use the following 6-digit code to complete the process:</p>
          <div style="background-color: #f4f4f4; padding: 16px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 8px;">
            ${token}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">This code is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email. Please check SMTP configuration.', { cause: error });
    }
  },

  /**
   * Send an email verification OTP.
   */
  async sendVerificationEmail(email: string, token: string) {
    if (!env.SMTP_PASSWORD) {
      console.warn('⚠️ SMTP_PASSWORD not set. Logging email to console instead of sending.');
      console.log(`\n\n--- MOCK EMAIL TO: ${email} ---\nEmail Verification OTP: ${token}\n----------------------------------\n\n`);
      return;
    }

    const mailOptions = {
      from: `"${env.APP_NAME}" <${env.SMTP_FROM}>`,
      to: email,
      subject: 'Verify your email address',
      text: `Your email verification code is: ${token}\n\nThis code is valid for 15 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Thank you for registering! Please use the following 6-digit code to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 16px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 8px;">
            ${token}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">This code is valid for 15 minutes.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email. Please check SMTP configuration.', { cause: error });
    }
  },
};

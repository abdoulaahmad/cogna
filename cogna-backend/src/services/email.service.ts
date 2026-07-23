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

const generateOtpTemplate = (title: string, description: string, token: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cogna OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030a08; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="color: #6b8e82; font-size: 13px; margin-bottom: 16px;">Your verification code to continue</p>
      <img src="https://www.cogna.store/logo-cogna.png" alt="Cogna" height="28" style="display: inline-block;">
    </div>

    <!-- Main Card -->
    <div style="background-color: #06120e; border: 1px solid #112a22; border-radius: 16px; padding: 40px 24px; text-align: center;">
      <!-- Icon -->
      <div style="margin-bottom: 24px;">
        <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; border: 1px solid #18B88A33; background-color: #030a08; line-height: 64px; font-size: 28px;">
          <span style="color: #18B88A;">✉️</span>
        </div>
      </div>

      <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 12px 0;">${title}</h1>
      <p style="color: #6b8e82; font-size: 15px; line-height: 1.5; margin: 0 0 32px 0; padding: 0 20px;">
        ${description}
      </p>

      <!-- Divider -->
      <div style="margin: 32px auto; width: 100%; max-width: 200px; height: 1px; background: linear-gradient(90deg, transparent, #112a22, transparent); position: relative;">
        <div style="position: absolute; top: -3px; left: 50%; margin-left: -3px; width: 6px; height: 6px; border-radius: 50%; background-color: #18B88A;"></div>
      </div>

      <p style="color: #6b8e82; font-size: 13px; margin: 0 0 16px 0;">Your One-Time Password (OTP)</p>

      <!-- OTP Boxes -->
      <div style="display: inline-block;">
        ${token.split('').map(digit => `
          <div style="display: inline-block; width: 44px; height: 56px; line-height: 56px; margin: 0 4px; background-color: #030a08; border: 1px solid #112a22; border-radius: 8px; font-size: 28px; font-weight: bold; color: #18B88A; font-family: monospace;">
            ${digit}
          </div>
        `).join('')}
      </div>

      <p style="color: #6b8e82; font-size: 13px; margin: 24px 0 0 0;">
        This code will expire in <span style="color: #18B88A;">15 minutes</span>.
      </p>
    </div>

    <!-- Security Card -->
    <div style="background-color: #06120e; border: 1px solid #112a22; border-radius: 12px; padding: 20px; margin-top: 16px; display: table; width: 100%; box-sizing: border-box;">
      <div style="display: table-cell; vertical-align: middle; width: 40px;">
        <div style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid #18B88A33; background-color: #030a08; text-align: center; line-height: 32px; font-size: 16px;">
          🛡️
        </div>
      </div>
      <div style="display: table-cell; vertical-align: middle; padding-left: 12px; text-align: left;">
        <h3 style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Keep your account safe</h3>
        <p style="color: #6b8e82; font-size: 13px; margin: 0;">Never share this code with anyone. Cogna will never ask for your OTP.</p>
      </div>
    </div>

    <!-- Footer Text -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Didn't request this code?</p>
      <p style="color: #6b8e82; font-size: 13px; margin: 0 0 40px 0;">If you didn't request this, you can safely ignore this email.</p>
    </div>

    <!-- Divider -->
    <div style="height: 1px; background-color: #112a22; margin-bottom: 32px;"></div>

    <!-- Bottom Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td align="left" style="vertical-align: middle;">
          <img src="https://www.cogna.store/logo-cogna.png" alt="Cogna" height="20" style="display: block; margin-bottom: 8px;">
          <span style="color: #6b8e82; font-size: 12px;">Premium AI tools & subscriptions</span>
        </td>
      </tr>
    </table>

    <div style="text-align: center;">
      <p style="color: #6b8e82; font-size: 12px; margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} Cogna. All rights reserved.</p>
      <p style="color: #6b8e82; font-size: 12px; margin: 0;">If you need help, contact us at <a href="mailto:support@cogna.store" style="color: #18B88A; text-decoration: none;">support@cogna.store</a></p>
    </div>
  </div>
</body>
</html>`;

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
      html: generateOtpTemplate(
        'Password Reset',
        'You recently requested to reset your password. Use the following 6-digit code to complete the process:',
        token
      ),
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
      html: generateOtpTemplate(
        'Verify Your Email',
        'Use the verification code below to verify your email address and continue securing your Cogna account.',
        token
      ),
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email. Please check SMTP configuration.', { cause: error });
    }
  },
};

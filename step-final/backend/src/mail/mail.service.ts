import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;

  constructor() {
    const host = process.env.SMTP_HOST ?? 'mailpit';
    const port = Number(process.env.SMTP_PORT ?? 1025);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    this.transporter = createTransport({
      host,
      port,
      secure,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@localhost',
      to,
      subject: 'Verify your email address',
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
      `,
      text: `Verify your email address by visiting: ${verifyUrl}\n\nThis link will expire in 24 hours.`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@localhost',
      to,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset</h1>
        <p>Please click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `,
      text: `Reset your password by visiting: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email.`,
    });
  }
}

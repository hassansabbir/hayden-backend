import path from 'path';
import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';

// Embedded (cid) rather than linked, so the logo renders even when the
// recipient's mail client blocks loading remote images by default.
const LOGO_ATTACHMENT = {
  filename: 'logo.png',
  path: path.resolve(process.cwd(), 'assets/email/logo.png'),
  cid: 'tiu-logo',
};

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new AppError(503, 'Email sending is not configured');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }

  return transporter;
};

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export const sendMail = async ({ to, subject, html, replyTo }: SendMailInput): Promise<void> => {
  const client = getTransporter();
  await client.sendMail({
    from: env.MAIL_FROM || env.SMTP_USER,
    to,
    subject,
    html,
    replyTo,
    // Every template renders `<img src="cid:tiu-logo">` in its header, so
    // the logo attachment travels with every email sent through this helper.
    attachments: [LOGO_ATTACHMENT],
  });
};

import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';
import { logger } from '../../config/logger';
import { sendMail } from '../../utils/mailer';
import { renderEmailLayout, renderInfoTable, renderQuoteBlock } from '../../utils/emailTemplates';

interface ContactMessagePayload {
  fullName: string;
  email: string;
  inquiryType: string;
  message: string;
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const buildAdminNotificationEmail = (payload: ContactMessagePayload): string =>
  renderEmailLayout({
    previewText: `New ${payload.inquiryType} inquiry from ${payload.fullName}`,
    heading: 'New Contact Form Submission',
    bodyHtml: `
      <p>You've received a new inquiry through the Tea It Up website contact form.</p>
      ${renderInfoTable([
        { label: 'Name', value: escapeHtml(payload.fullName) },
        { label: 'Email', value: escapeHtml(payload.email) },
        { label: 'Inquiry Type', value: escapeHtml(payload.inquiryType) },
      ])}
      <p style="font-weight:700;margin:0 0 8px;">Message</p>
      ${renderQuoteBlock(escapeHtml(payload.message))}
      <p>Reply directly to this email to respond to ${escapeHtml(payload.fullName)} — the reply-to address is already set to theirs.</p>
    `,
  });

const buildSenderConfirmationEmail = (payload: ContactMessagePayload): string =>
  renderEmailLayout({
    previewText: "We've received your message and will be in touch soon.",
    heading: "We've Received Your Message",
    bodyHtml: `
      <p>Hi ${escapeHtml(payload.fullName)},</p>
      <p>Thank you for reaching out to Tea It Up. Our concierge team has received your inquiry and will get back to you within 1–2 business days.</p>
      ${renderInfoTable([{ label: 'Inquiry Type', value: escapeHtml(payload.inquiryType) }])}
      <p style="font-weight:700;margin:0 0 8px;">Your Message</p>
      ${renderQuoteBlock(escapeHtml(payload.message))}
      <p>If you have any additional details to share, please submit a new message through our contact form.</p>
      <p style="margin-top:24px;">Warm regards,<br/>The Tea It Up Concierge Team</p>
    `,
  });

export const sendContactMessage = async (payload: ContactMessagePayload): Promise<void> => {
  if (!env.CONTACT_RECEIVER_EMAIL) {
    throw new AppError(503, 'The contact form is not configured yet, please try again later');
  }

  // The notification to the concierge inbox is the part the business
  // actually depends on, so its failure should surface as a 500 to the
  // caller (and get retried). The confirmation copy to the sender is a
  // courtesy — log and swallow so a flaky send to their address doesn't
  // make a successfully-delivered inquiry look like it failed.
  await sendMail({
    to: env.CONTACT_RECEIVER_EMAIL,
    subject: `[${payload.inquiryType}] New message from ${payload.fullName}`,
    replyTo: payload.email,
    html: buildAdminNotificationEmail(payload),
  });

  try {
    await sendMail({
      to: payload.email,
      subject: "We've received your message — Tea It Up",
      html: buildSenderConfirmationEmail(payload),
    });
  } catch (err) {
    logger.error('Failed to send contact form confirmation email to sender', { err, to: payload.email });
  }
};

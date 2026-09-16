// Shared HTML shell for all outbound emails — keeps every message on-brand
// (same header/logo/footer) without duplicating markup per email.
const BRAND_DARK_GREEN = '#0a4a1b';
const BRAND_ACCENT_GREEN = '#2ea268';
const BRAND_SOFT_BG = '#f4f5f4';
const BRAND_TEXT = '#33403a';
const BRAND_MUTED = '#647167';

interface EmailLayoutOptions {
  previewText: string;
  heading: string;
  bodyHtml: string;
}

export const renderEmailLayout = ({ previewText, heading, bodyHtml }: EmailLayoutOptions): string => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND_SOFT_BG};font-family:Segoe UI, Arial, Helvetica, sans-serif;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${previewText}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_SOFT_BG};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(10,74,27,0.06);">
            <tr>
              <td style="background-color:${BRAND_DARK_GREEN};padding:32px 32px 24px;text-align:center;">
                <img src="cid:tiu-logo" alt="Tee It Up" width="56" height="auto" style="display:block;margin:0 auto 12px;border-radius:12px;" />
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:1px;">TEE IT UP</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                <h1 style="margin:0 0 20px;font-size:21px;color:${BRAND_DARK_GREEN};">${heading}</h1>
                <div style="font-size:14.5px;line-height:1.65;color:${BRAND_TEXT};">
                  ${bodyHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 32px;">
                <hr style="border:none;border-top:1px solid #ececec;margin:0 0 20px;" />
                <p style="margin:0;font-size:12px;color:${BRAND_MUTED};">
                  This is an automated message from Tee It Up. Please do not reply directly unless instructed.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:${BRAND_SOFT_BG};padding:18px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;color:${BRAND_MUTED};">
                  © ${new Date().getFullYear()} Tee It Up. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const renderInfoTable = (rows: Array<{ label: string; value: string }>): string => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;border-collapse:collapse;">
    ${rows
      .map(
        ({ label, value }) => `
      <tr>
        <td style="padding:8px 0;width:140px;font-size:11px;font-weight:700;letter-spacing:0.5px;color:${BRAND_MUTED};text-transform:uppercase;vertical-align:top;">${label}</td>
        <td style="padding:8px 0;font-size:14.5px;color:${BRAND_TEXT};vertical-align:top;">${value}</td>
      </tr>`
      )
      .join('')}
  </table>
`;

export const renderQuoteBlock = (text: string): string => `
  <div style="background-color:${BRAND_SOFT_BG};border-left:3px solid ${BRAND_ACCENT_GREEN};border-radius:10px;padding:16px 18px;margin:0 0 20px;font-size:14.5px;line-height:1.65;color:${BRAND_TEXT};white-space:pre-wrap;">${text}</div>
`;


// ─── Club welcome / credentials email ───────────────────────────────────────
// Sent to the club owner's email address immediately after an admin creates
// their account via the "Create New Club" modal in the dashboard.

interface ClubWelcomeEmailOptions {
  clubName: string;
  email: string;
  password: string;      // plain-text temporary password — captured before hashing
  loginUrl: string;
}

export const renderClubWelcomeEmail = ({
  clubName,
  email,
  password,
  loginUrl,
}: ClubWelcomeEmailOptions): string =>
  renderEmailLayout({
    previewText: `Your Tee It Up club account is ready — here are your login credentials.`,
    heading: `Welcome to Tee It Up, ${clubName}!`,
    bodyHtml: `
      <p>Your club has been created on the Tee It Up platform. An administrator has set up
      your account and you can now log in to the dashboard to complete your club profile.</p>

      <p style="margin:0 0 8px;font-weight:700;">Your login credentials</p>
      ${renderInfoTable([
        { label: 'Dashboard URL', value: `<a href="${loginUrl}" style="color:${BRAND_ACCENT_GREEN};">${loginUrl}</a>` },
        { label: 'Email', value: email },
        { label: 'Password', value: `<code style="background:${BRAND_SOFT_BG};padding:2px 8px;border-radius:4px;font-size:14px;">${password}</code>` },
      ])}

      <p>For your security, you will be asked to <strong>create a new password</strong>
      the first time you sign in.</p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td style="border-radius:8px;background-color:${BRAND_ACCENT_GREEN};">
            <a href="${loginUrl}"
               style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
              Sign In to Dashboard →
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:${BRAND_MUTED};">
        If you did not expect this email, please contact us immediately at
        <a href="mailto:support@teeitup.com" style="color:${BRAND_ACCENT_GREEN};">support@teeitup.com</a>.
        Do not share your credentials with anyone.
      </p>
    `,
  });

// ─── OTP / password-reset email ──────────────────────────────────────────────
// Sent to the user's registered email when they trigger "Forgot Password".

interface OtpEmailOptions {
  fullName: string;
  otp: string;
  expiresInMinutes: number;
}

export const renderOtpEmail = ({ fullName, otp, expiresInMinutes }: OtpEmailOptions): string =>
  renderEmailLayout({
    previewText: `Your Tee It Up verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
    heading: 'Your Password Reset Code',
    bodyHtml: `
      <p>Hi ${fullName},</p>
      <p>We received a request to reset your Tee It Up account password. Use the
      verification code below to continue. This code is valid for
      <strong>${expiresInMinutes} minutes</strong> and can only be used once.</p>

      <div style="margin:28px 0;text-align:center;">
        <div style="display:inline-block;background-color:${BRAND_SOFT_BG};border:2px solid ${BRAND_ACCENT_GREEN};border-radius:12px;padding:18px 36px;">
          <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:${BRAND_DARK_GREEN};">${otp}</span>
        </div>
      </div>

      <p>Enter this code on the verification page to set your new password.</p>
      <p style="font-size:13px;color:${BRAND_MUTED};">
        If you didn't request a password reset, you can safely ignore this email.
        Your password will not change unless you complete the reset process.
      </p>
    `,
  });

// ─── Club approved email ──────────────────────────────────────────────────────
// Sent to the club owner when an admin approves their pending club profile.

interface ClubApprovedEmailOptions {
  clubName: string;
  ownerName: string;
  dashboardUrl: string;
}

export const renderClubApprovedEmail = ({
  clubName,
  ownerName,
  dashboardUrl,
}: ClubApprovedEmailOptions): string =>
  renderEmailLayout({
    previewText: `Great news — ${clubName} is now live on Tee It Up and accepting bookings!`,
    heading: `Your Club is Approved!`,
    bodyHtml: `
      <p>Hi ${ownerName},</p>
      <p>Congratulations! <strong>${clubName}</strong> has been reviewed and approved by our team.
      Your club is now <strong>live on Tee It Up</strong> and visible to golfers.</p>

      <p style="margin:0 0 8px;font-weight:700;">What happens next</p>
      ${renderInfoTable([
        { label: 'Status', value: '✅ Active — visible to all users' },
        { label: 'Bookings', value: 'Golfers can now discover and book your tee times' },
        { label: 'Dashboard', value: `<a href="${dashboardUrl}" style="color:${BRAND_ACCENT_GREEN};">Manage your club</a>` },
      ])}

      <p>Log in to your dashboard to manage tee times, review bookings, and keep your
      club profile up to date.</p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td style="border-radius:8px;background-color:${BRAND_ACCENT_GREEN};">
            <a href="${dashboardUrl}"
               style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
              Go to Dashboard →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin-top:24px;">Warm regards,<br/>The Tee It Up Team</p>
    `,
  });

// ─── Admin course approved confirmation email ─────────────────────────────────
// Sent to the admin who approved a club, confirming the action.

interface AdminCourseApprovedEmailOptions {
  clubName: string;
  clubEmail: string;
}

export const renderAdminCourseApprovedEmail = ({
  clubName,
  clubEmail,
}: AdminCourseApprovedEmailOptions): string =>
  renderEmailLayout({
    previewText: `You have successfully approved the club: ${clubName}.`,
    heading: `Course Approval Confirmed`,
    bodyHtml: `
      <p>Hello Admin,</p>
      <p>This is an automated confirmation that you have successfully approved a new club on the platform. The club is now live and visible to golfers.</p>

      <p style="margin:0 0 8px;font-weight:700;">Approved Course Details</p>
      ${renderInfoTable([
        { label: 'Course Name', value: clubName },
        { label: 'Club Email', value: clubEmail },
        { label: 'Status', value: '✅ Active' },
      ])}

      <p>An automated welcome email has also been dispatched to the club owner notifying them of the approval.</p>
    `,
  });

// ─── Booking Notification Email ──────────────────────────────────────────────
// Sent to the user and admin upon booking creation or confirmation.

interface BookingNotificationEmailOptions {
  heading: string;
  introHtml: string;
  bookingId: string;
  courseName: string;
  date: string;
  time: string;
  players: number;
  totalPrice: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
}

export const renderBookingNotificationEmail = ({
  heading,
  introHtml,
  bookingId,
  courseName,
  date,
  time,
  players,
  totalPrice,
  contactName,
  contactEmail,
  contactPhone,
  status,
}: BookingNotificationEmailOptions): string =>
  renderEmailLayout({
    previewText: `Booking Update for ${courseName} (ID: ${bookingId})`,
    heading,
    bodyHtml: `
      ${introHtml}

      <p style="margin:0 0 8px;font-weight:700;">Booking Summary</p>
      ${renderInfoTable([
        { label: 'Booking ID', value: bookingId },
        { label: 'Course', value: courseName },
        { label: 'Date', value: date },
        { label: 'Time', value: time },
        { label: 'Players', value: players.toString() },
        { label: 'Total', value: totalPrice },
        { label: 'Status', value: status },
      ])}

      <p style="margin:24px 0 8px;font-weight:700;">Contact Information</p>
      ${renderInfoTable([
        { label: 'Name', value: contactName },
        { label: 'Email', value: contactEmail },
        { label: 'Phone', value: contactPhone },
      ])}
    `,
  });

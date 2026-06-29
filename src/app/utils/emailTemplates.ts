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
                <img src="cid:tiu-logo" alt="Tea It Up" width="56" height="auto" style="display:block;margin:0 auto 12px;border-radius:12px;" />
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:1px;">TEA IT UP</span>
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
                  This is an automated message from Tea It Up. Please do not reply directly unless instructed.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:${BRAND_SOFT_BG};padding:18px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;color:${BRAND_MUTED};">
                  © ${new Date().getFullYear()} Tea It Up. All rights reserved.
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

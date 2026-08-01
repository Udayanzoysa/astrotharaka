export type EmailTemplateId =
  | 'email_verify'
  | 'password_reset'
  | 'password_changed'
  | 'report_pdf';

export type BuiltEmail = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:Segoe UI,Nirmala UI,Arial,sans-serif;color:#f5f0e6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0f19;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#121826;border:1px solid #2a3348;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:22px 24px;border-bottom:1px solid #2a3348;">
          <div style="font-size:22px;font-weight:700;color:#f5f0e6;">Taraka</div>
          <div style="font-size:14px;color:#d4af37;margin-top:4px;">තාරකා ජ්‍යෝතිෂ්‍ය සේවය</div>
        </td></tr>
        <tr><td style="padding:24px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #2a3348;font-size:11px;color:#8a93a7;line-height:1.5;">
          Astrology guidance for cultural, spiritual, and entertainment purposes.
          <br/>© Taraka
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildEmailVerify(input: {
  fullName?: string;
  code: string;
  expiresMinutes: number;
  verificationLink?: string;
}): BuiltEmail {
  const name = input.fullName?.trim() || 'there';
  const subject = 'Taraka — verify your email';
  const text = [
    `Hello ${name},`,
    '',
    input.verificationLink
      ? `Please verify your email by clicking the link below:\n${input.verificationLink}`
      : `Your Taraka verification code is: ${input.code}`,
    `This code expires in ${input.expiresMinutes} minutes.`,
    '',
    'If you did not create an account, you can ignore this email.',
    '',
    '— Taraka (තාරකා)',
  ].join('\n');
  const html = layout(
    subject,
    `
    <p style="margin:0 0 12px;font-size:16px;">Hello ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;color:#c8cdd8;">${
      input.verificationLink
        ? 'Click the button below to verify your email and activate your Taraka account.'
        : 'Use this code to verify your email and activate your Taraka account.'
    }</p>
    ${
      input.verificationLink
        ? `<a href="${escapeHtml(
            input.verificationLink,
          )}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#d4af37;color:#0b0f19;text-decoration:none;font-weight:700;margin-bottom:16px;">Verify Email</a>`
        : `<div style="display:inline-block;padding:14px 22px;border-radius:12px;background:#1a2234;border:1px solid #d4af37;font-size:28px;letter-spacing:0.28em;font-weight:700;color:#d4af37;">${escapeHtml(
            input.code,
          )}</div>`
    }
    <p style="margin:16px 0 0;font-size:13px;color:#8a93a7;">Expires in ${input.expiresMinutes} minutes.</p>
  `,
  );
  return { subject, text, html };
}

export function buildPasswordReset(input: {
  fullName?: string;
  code: string;
  expiresMinutes: number;
  resetLink?: string;
}): BuiltEmail {
  const name = input.fullName?.trim() || 'there';
  const subject = 'Taraka — reset your password';
  const text = [
    `Hello ${name},`,
    '',
    input.resetLink
      ? `Reset your password using this link:\n${input.resetLink}`
      : `Your password reset code is: ${input.code}`,
    `This link expires in ${input.expiresMinutes} minutes.`,
    '',
    'If you did not request a reset, ignore this email.',
    '',
    '— Taraka (තාරකා)',
  ].join('\n');
  const html = layout(
    subject,
    `
    <p style="margin:0 0 12px;font-size:16px;">Hello ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;color:#c8cdd8;">${
      input.resetLink
        ? 'Click the button below to choose a new password for your Taraka account.'
        : 'Use this code to reset your Taraka password.'
    }</p>
    ${
      input.resetLink
        ? `<a href="${escapeHtml(
            input.resetLink,
          )}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#d4af37;color:#0b0f19;text-decoration:none;font-weight:700;margin-bottom:16px;">Reset password</a>`
        : `<div style="display:inline-block;padding:14px 22px;border-radius:12px;background:#1a2234;border:1px solid #d4af37;font-size:28px;letter-spacing:0.28em;font-weight:700;color:#d4af37;">${escapeHtml(
            input.code,
          )}</div>`
    }
    <p style="margin:16px 0 0;font-size:13px;color:#8a93a7;">Expires in ${input.expiresMinutes} minutes.</p>
  `,
  );
  return { subject, text, html };
}

export function buildPasswordChanged(input: { fullName?: string }): BuiltEmail {
  const name = input.fullName?.trim() || 'there';
  const subject = 'Taraka — your password was changed';
  const text = [
    `Hello ${name},`,
    '',
    'Your Taraka account password was changed successfully.',
    'If this was not you, reset your password immediately and contact support.',
    '',
    '— Taraka (තාරකා)',
  ].join('\n');
  const html = layout(
    subject,
    `
    <p style="margin:0 0 12px;font-size:16px;">Hello ${escapeHtml(name)},</p>
    <p style="margin:0 0 12px;color:#c8cdd8;">Your Taraka account password was changed successfully.</p>
    <p style="margin:0;font-size:13px;color:#8a93a7;">If this was not you, reset your password immediately.</p>
  `,
  );
  return { subject, text, html };
}

export function buildReportPdfEmail(input: {
  fullName?: string;
  productName: string;
  orderNumber: string;
  downloadUrl: string;
  attached: boolean;
}): BuiltEmail {
  const name = input.fullName?.trim() || 'there';
  const subject = `Taraka — your report is ready (${input.orderNumber})`;
  const attachNote = input.attached
    ? 'Your PDF report is attached to this email.'
    : 'Open the link below to view and download your report.';
  const text = [
    `Hello ${name},`,
    '',
    `Your ${input.productName} is ready.`,
    `Reference: ${input.orderNumber}`,
    attachNote,
    '',
    `View online: ${input.downloadUrl}`,
    '',
    '— Taraka (තාරකා)',
  ].join('\n');
  const html = layout(
    subject,
    `
    <p style="margin:0 0 12px;font-size:16px;">Hello ${escapeHtml(name)},</p>
    <p style="margin:0 0 12px;color:#c8cdd8;">Your <strong style="color:#d4af37;">${escapeHtml(
      input.productName,
    )}</strong> is ready.</p>
    <p style="margin:0 0 16px;font-size:13px;color:#8a93a7;">Reference: ${escapeHtml(
      input.orderNumber,
    )}<br/>${escapeHtml(attachNote)}</p>
    <a href="${escapeHtml(input.downloadUrl)}"
       style="display:inline-block;padding:12px 18px;border-radius:10px;background:#d4af37;color:#0b0f19;text-decoration:none;font-weight:700;">
      View report
    </a>
  `,
  );
  return { subject, text, html };
}

export const EMAIL_TEMPLATE_CATALOG: Array<{
  id: EmailTemplateId;
  title: string;
  description: string;
}> = [
  {
    id: 'email_verify',
    title: 'Registration / email verification',
    description: 'OTP code sent after signup or resend verification.',
  },
  {
    id: 'password_reset',
    title: 'Password reset',
    description: 'OTP code for forgot-password flow.',
  },
  {
    id: 'password_changed',
    title: 'Password changed',
    description: 'Confirmation after password reset or change.',
  },
  {
    id: 'report_pdf',
    title: 'Report PDF delivery',
    description: 'Full horoscope PDF with download link and attachment.',
  },
];

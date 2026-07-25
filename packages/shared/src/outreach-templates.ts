export type OutreachTemplateId =
  | 'account_invite'
  | 'feature_highlight'
  | 'account_activity_report'
  | 'promo_generic';

export type OutreachChannel = 'email' | 'sms' | 'whatsapp';

export type OutreachTemplate = {
  id: OutreachTemplateId;
  title: string;
  description: string;
  channels: OutreachChannel[];
  emailSubject: string;
  emailText: (vars: OutreachVars) => string;
  smsText: (vars: OutreachVars) => string;
  whatsappText: (vars: OutreachVars) => string;
};

export type OutreachVars = {
  fullName: string;
  siteName?: string;
  signupUrl?: string;
  extraMessage?: string;
};

const SITE = 'Taraka';

function nameOf(vars: OutreachVars) {
  return vars.fullName?.trim() || 'there';
}

function siteOf(vars: OutreachVars) {
  return vars.siteName?.trim() || SITE;
}

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: 'account_invite',
    title: 'Account creation invitation',
    description: 'Invite guests to create an account and unlock more features.',
    channels: ['email', 'sms', 'whatsapp'],
    emailSubject: 'Create your Taraka account',
    emailText: (vars) =>
      [
        `Hello ${nameOf(vars)},`,
        '',
        `Thank you for trying ${siteOf(vars)}. Create a free account to save reports, track orders, and unlock additional guidance.`,
        vars.signupUrl ? `Sign up: ${vars.signupUrl}` : '',
        vars.extraMessage ? `\n${vars.extraMessage}` : '',
        '',
        `— ${siteOf(vars)}`,
      ]
        .filter(Boolean)
        .join('\n'),
    smsText: (vars) =>
      `${siteOf(vars)}: Hi ${nameOf(vars)}, create an account to unlock more features.${
        vars.signupUrl ? ` ${vars.signupUrl}` : ''
      }`,
    whatsappText: (vars) =>
      `Hello ${nameOf(vars)}, thank you for visiting ${siteOf(vars)}. Create an account to unlock saved reports and more features.${
        vars.signupUrl ? ` ${vars.signupUrl}` : ''
      }`,
  },
  {
    id: 'feature_highlight',
    title: 'Feature highlight',
    description: 'Highlight premium reports and account benefits.',
    channels: ['email', 'sms', 'whatsapp'],
    emailSubject: 'Discover more with Taraka',
    emailText: (vars) =>
      [
        `Hello ${nameOf(vars)},`,
        '',
        `${siteOf(vars)} offers detailed horoscope reports, order tracking, and personalized guidance when you sign in.`,
        vars.extraMessage ? `\n${vars.extraMessage}` : '',
        vars.signupUrl ? `\nExplore: ${vars.signupUrl}` : '',
        '',
        `— ${siteOf(vars)}`,
      ]
        .filter(Boolean)
        .join('\n'),
    smsText: (vars) =>
      `${siteOf(vars)}: Discover full reports & saved guidance when you sign up.${
        vars.signupUrl ? ` ${vars.signupUrl}` : ''
      }`,
    whatsappText: (vars) =>
      `Hi ${nameOf(vars)} — with a ${siteOf(vars)} account you can save reports and unlock richer guidance.${
        vars.signupUrl ? ` ${vars.signupUrl}` : ''
      }`,
  },
  {
    id: 'account_activity_report',
    title: 'Account activity report',
    description: 'Summary email for a registered user account.',
    channels: ['email'],
    emailSubject: 'Your Taraka account activity summary',
    emailText: (vars) =>
      [
        `Hello ${nameOf(vars)},`,
        '',
        `Here is a summary of your ${siteOf(vars)} account activity.`,
        vars.extraMessage || '',
        '',
        `— ${siteOf(vars)}`,
      ]
        .filter(Boolean)
        .join('\n'),
    smsText: () => '',
    whatsappText: () => '',
  },
  {
    id: 'promo_generic',
    title: 'Promotional message',
    description: 'Broadcast a custom promotional note to selected users.',
    channels: ['email', 'whatsapp'],
    emailSubject: 'An update from Taraka',
    emailText: (vars) =>
      [
        `Hello ${nameOf(vars)},`,
        '',
        vars.extraMessage || `We have an update from ${siteOf(vars)}.`,
        vars.signupUrl ? `\n${vars.signupUrl}` : '',
        '',
        `— ${siteOf(vars)}`,
      ]
        .filter(Boolean)
        .join('\n'),
    smsText: (vars) => vars.extraMessage || `${siteOf(vars)} update`,
    whatsappText: (vars) =>
      vars.extraMessage || `Hello ${nameOf(vars)}, we have an update from ${siteOf(vars)}.`,
  },
];

export function getOutreachTemplate(id: string): OutreachTemplate | undefined {
  return OUTREACH_TEMPLATES.find((t) => t.id === id);
}

export function buildSimpleHtmlEmail(subject: string, text: string, siteName = SITE): {
  subject: string;
  text: string;
  html: string;
} {
  const paragraphs = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line, i, arr) => line || (i > 0 && arr[i - 1]))
    .map((line) =>
      line
        ? `<p style="margin:0 0 12px;font-size:15px;color:#f5f0e6;">${escapeHtml(line)}</p>`
        : '<p style="margin:0 0 12px;">&nbsp;</p>',
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px;background:#0b0f19;font-family:Segoe UI,Arial,sans-serif;color:#f5f0e6;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#121826;border:1px solid #2a3348;border-radius:16px;">
    <tr><td style="padding:20px 24px;border-bottom:1px solid #2a3348;font-size:20px;font-weight:700;">${escapeHtml(
      siteName,
    )}</td></tr>
    <tr><td style="padding:24px;">${paragraphs}</td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

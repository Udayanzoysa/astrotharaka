export enum LanguageCode {
  EN = 'en',
  SI = 'si',
  TA = 'ta',
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  SUPPORT = 'SUPPORT',
  FINANCE = 'FINANCE',
  CONTENT = 'CONTENT',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

/** Forward-compatible commerce enums (Phase 2+) */
export enum OrderStatus {
  DRAFT = 'DRAFT',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAYMENT_UNDER_REVIEW = 'PAYMENT_UNDER_REVIEW',
  PAID = 'PAID',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
}

export enum ReportStatus {
  QUEUED = 'QUEUED',
  CALCULATING = 'CALCULATING',
  GENERATING_CONTENT = 'GENERATING_CONTENT',
  RENDERING_PDF = 'RENDERING_PDF',
  READY = 'READY',
  FAILED = 'FAILED',
}

export const QUEUE_NAMES = {
  ASTROLOGY_CALCULATE: 'astrology.calculate',
  REPORT_GENERATE: 'report.generate',
  GUEST_REPORT: 'guest.report',
  PDF_RENDER: 'pdf.render',
  NOTIFY_EMAIL: 'notify.email',
  NOTIFY_WHATSAPP: 'notify.whatsapp',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export enum PaymentMethod {
  PAYHERE = 'PAYHERE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DEV_CONFIRM = 'DEV_CONFIRM',
}

export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  USER_BLOCKED: 'USER_BLOCKED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SOCIAL_LOGIN_REQUIRED: 'SOCIAL_LOGIN_REQUIRED',
  OAUTH_NOT_CONFIGURED: 'OAUTH_NOT_CONFIGURED',
  OAUTH_EMAIL_REQUIRED: 'OAUTH_EMAIL_REQUIRED',
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  INVALID_ORDER_STATE: 'INVALID_ORDER_STATE',
  REPORT_NOT_READY: 'REPORT_NOT_READY',
  INVALID_PROMO: 'INVALID_PROMO',
  PROMO_EXPIRED: 'PROMO_EXPIRED',
  PROMO_LIMIT_REACHED: 'PROMO_LIMIT_REACHED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  FREE_PREVIEW_USED: 'FREE_PREVIEW_USED',
  LOGIN_REQUIRED: 'LOGIN_REQUIRED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface AstrologyCalculateJobPayload {
  birthProfileId: string;
  userId: string;
  requestId: string;
}

export interface ReportGenerateJobPayload {
  orderId: string;
  birthProfileId: string;
  language: LanguageCode;
  requestId: string;
}

export interface GuestReportJobPayload {
  guestReportId: string;
}

export interface NotifyEmailJobPayload {
  userId: string;
  kind: 'report_ready' | 'guest_report_ready';
  /** Order report delivery */
  orderId?: string;
  reportId?: string;
  /** Guest / package horoscope delivery */
  guestReportId?: string;
  downloadToken?: string;
  /** Attach generated PDF when available (default true for guest/order report send). */
  attachPdf?: boolean;
}

export {
  buildEmailVerify,
  buildPasswordReset,
  buildPasswordChanged,
  buildReportPdfEmail,
  EMAIL_TEMPLATE_CATALOG,
} from './email-templates';
export type { EmailTemplateId, BuiltEmail } from './email-templates';

export {
  OUTREACH_TEMPLATES,
  getOutreachTemplate,
  buildSimpleHtmlEmail,
} from './outreach-templates';
export type {
  OutreachTemplateId,
  OutreachChannel,
  OutreachTemplate,
  OutreachVars,
} from './outreach-templates';

export interface NotifyWhatsAppJobPayload {
  userId: string;
  kind: 'report_ready' | 'guest_report_ready';
  orderId?: string;
  reportId?: string;
  guestReportId?: string;
  downloadToken?: string;
}

export {
  FOCUS_TOPIC_IDS,
  FOCUS_TOPIC_MAX,
  FOCUS_TOPIC_LABELS_EN,
  normalizeFocusTopics,
  isFocusTopicId,
  focusTopicLabels,
  focusTopicsForPrompt,
  focusTopicsPromptBlock,
} from './focus-topics';
export type { FocusTopicId, FocusTopicLabels } from './focus-topics';

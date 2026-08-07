export type Language = "en" | "si" | "ta";

export type CustomerProfile = {
  id: string;
  fullName: string;
  mobileNumber: string | null;
  whatsappNumber: string | null;
  preferredLanguage: Language;
  country: string;
  birthDate?: string | null;
  birthTime?: string | null;
  unknownBirthTime?: boolean;
  birthPlaceName?: string | null;
  gender?: string | null;
  emailMarketingConsent: boolean;
  whatsappMarketingConsent: boolean;
};

export type User = {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerifiedAt?: string | null;
  createdAt: string;
  hasUsedFreePreview?: boolean;
  profile: CustomerProfile | null;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type RegisterPendingResponse = {
  requiresVerification: true;
  email: string;
  message: string;
  user: User;
};

export type BirthProfile = {
  id: string;
  userId: string;
  fullName: string;
  birthDate: string;
  birthTime: string | null;
  unknownBirthTime: boolean;
  birthPlaceName: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  preferredLanguage: Language;
  notes: string | null;
  accuracyWarning: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: unknown;
};

export type Product = {
  id: string;
  slug: string;
  nameEn: string;
  nameSi: string | null;
  nameTa: string | null;
  descriptionEn: string;
  descriptionSi: string | null;
  descriptionTa: string | null;
  estimatedMinutes: number;
  supportedLanguages: Language[];
  samplePreviewUrl: string | null;
  isActive?: boolean;
  sortOrder?: number;
  price: { currency: string; amount: number } | null;
};

export type AdminPromotion = {
  id: string;
  code: string;
  name: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: string | number;
  minOrderAmount?: string | number | null;
  maxRedemptions?: number | null;
  perCustomerLimit: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  language: Language;
  currency: string;
  promoCode?: string | null;
  promotionId?: string | null;
  productPriceAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  paidAt: string | null;
  completedAt: string | null;
  product: {
    id: string;
    slug: string;
    nameEn: string;
    nameSi: string | null;
    nameTa: string | null;
  };
  birthProfile: { id: string; fullName: string; birthPlaceName: string };
  payments: Array<{
    id: string;
    method: string;
    status: string;
    amount: number;
    currency: string;
  }>;
  reports: Array<{
    id: string;
    version: number;
    status: string;
    title: string | null;
    downloadUrl: string | null;
    chartSvgUrl?: string | null;
    readyAt: string | null;
  }>;
};

export type OrderReportView = {
  orderId: string;
  orderNumber: string;
  reportId: string;
  version: number;
  title: string | null;
  status: string;
  downloadUrl: string;
  contentText: string | null;
};

export type SubscriptionPackage = {
  id: string;
  code: string;
  nameEn: string;
  nameSi: string | null;
  nameTa: string | null;
  descriptionEn: string | null;
  descriptionSi: string | null;
  descriptionTa: string | null;
  priceLkr: number;
  babyNamesQuota: number;
  porondamQuota: number;
  horoscopeQuota: number;
  dreamInterpretationQuota: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UserSubscription = {
  id: string;
  userId: string;
  packageId: string;
  packageCode: string;
  packageNameEn: string;
  packageNameSi: string | null;
  priceLkr: number;
  babyNamesQuota: number;
  porondamQuota: number;
  horoscopeQuota: number;
  dreamInterpretationQuota: number;
  babyNamesUsed: number;
  porondamUsed: number;
  horoscopeUsed: number;
  dreamInterpretationUsed: number;
  babyNamesRemaining: number;
  porondamRemaining: number;
  horoscopeRemaining: number;
  dreamInterpretationRemaining: number;
  durationDays: number;
  startAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  paymentRef: string | null;
  monthCycle: string | null;
};

export type SubscriptionCheckout = {
  id: string;
  checkoutNumber: string;
  userId: string;
  packageId: string;
  packageCode: string;
  packageNameEn: string;
  priceLkr: number;
  currency: string;
  status:
    | "AWAITING_PAYMENT"
    | "PAYMENT_UNDER_REVIEW"
    | "PAID"
    | "ACTIVATED"
    | "CANCELLED";
  userSubscriptionId: string | null;
  createdAt: string;
  paidAt: string | null;
  activatedAt: string | null;
  userEmail?: string | null;
  userName?: string | null;
  userMobile?: string | null;
  userWhatsapp?: string | null;
  payments?: Array<{
    id: string;
    method: string;
    status: string;
    amount: number;
    providerRef: string | null;
    hasBankSlip: boolean;
    bankAccountId: string | null;
    bankAccount?: { bankName: string; accountNumber: string } | null;
  }>;
};

export function productName(product: Pick<Product, "nameEn" | "nameSi" | "nameTa">, lang: Language) {
  if (lang === "si") return product.nameSi || product.nameEn;
  if (lang === "ta") return product.nameTa || product.nameEn;
  return product.nameEn;
}

export function packageName(
  pkg: Pick<SubscriptionPackage, "nameEn" | "nameSi" | "nameTa">,
  lang: Language,
) {
  if (lang === "si") return pkg.nameSi || pkg.nameEn;
  if (lang === "ta") return pkg.nameTa || pkg.nameEn;
  return pkg.nameEn;
}

export function packageDescription(
  pkg: Pick<SubscriptionPackage, "descriptionEn" | "descriptionSi" | "descriptionTa">,
  lang: Language,
) {
  if (lang === "si") return pkg.descriptionSi || pkg.descriptionEn || "";
  if (lang === "ta") return pkg.descriptionTa || pkg.descriptionEn || "";
  return pkg.descriptionEn || "";
}

export function productDescription(
  product: Pick<Product, "descriptionEn" | "descriptionSi" | "descriptionTa">,
  lang: Language,
) {
  if (lang === "si") return product.descriptionSi || product.descriptionEn;
  if (lang === "ta") return product.descriptionTa || product.descriptionEn;
  return product.descriptionEn;
}

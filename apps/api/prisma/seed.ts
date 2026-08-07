import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const permissions = [
    { code: 'users.read', name: 'Read users' },
    { code: 'orders.read', name: 'Read orders' },
    { code: 'orders.manage', name: 'Manage orders' },
    { code: 'payments.review', name: 'Review payments' },
    { code: 'products.manage', name: 'Manage products' },
    { code: 'prompts.manage', name: 'Manage prompts' },
    { code: 'admin.full', name: 'Full admin access' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { name: permission.name },
      create: permission,
    });
  }

  const roles: Array<{ code: string; name: string; permissionCodes: string[] }> = [
    {
      code: UserRole.CUSTOMER,
      name: 'Customer',
      permissionCodes: [],
    },
    {
      code: UserRole.SUPPORT,
      name: 'Support Officer',
      permissionCodes: ['users.read', 'orders.read', 'orders.manage'],
    },
    {
      code: UserRole.FINANCE,
      name: 'Finance Administrator',
      permissionCodes: ['orders.read', 'payments.review'],
    },
    {
      code: UserRole.CONTENT,
      name: 'Content Administrator',
      permissionCodes: ['products.manage', 'prompts.manage'],
    },
    {
      code: UserRole.SUPER_ADMIN,
      name: 'Super Administrator',
      permissionCodes: permissions.map((p) => p.code),
    },
  ];

  for (const role of roles) {
    const saved = await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: { code: role.code, name: role.name },
    });

    for (const permissionCode of role.permissionCodes) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: saved.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: saved.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const products = [
    {
      slug: 'basic-birth-chart',
      nameEn: 'Basic Birth Chart Report',
      nameSi: 'මූලික උපන් සිතියම් වාර්තාව',
      nameTa: 'அடிப்படை பிறப்பு விளக்க அறிக்கை',
      descriptionEn: 'Lagna overview, key planetary highlights, and practical guidance in your language.',
      descriptionSi: 'ලග්න සාරාංශය, ග්‍රහ ලක්ෂණ සහ ප්‍රායෝගික මගපෙන්වීම.',
      descriptionTa: 'லக்னம் சுருக்கம், கிரக சிறப்புகள் மற்றும் நடைமுறை வழிகாட்டல்.',
      estimatedMinutes: 10,
      amount: '1490.00',
      sortOrder: 1,
    },
    {
      slug: 'detailed-life-report',
      nameEn: 'Detailed Life Report',
      nameSi: 'විස්තීර්ණ ජීවිත වාර්තාව',
      nameTa: 'விரிவான வாழ்க்கை அறிக்கை',
      descriptionEn: 'Deeper chart analysis across career, relationships, and timing themes.',
      descriptionSi: 'රැකියාව, සබඳතා සහ කාල චක්‍ර පිළිබඳ ගැඹුරු විශ්ලේෂණය.',
      descriptionTa: 'தொழில், உறவுகள் மற்றும் கால கட்டங்கள் குறித்த ஆழமான பகுப்பாய்வு.',
      estimatedMinutes: 20,
      amount: '3490.00',
      sortOrder: 2,
    },
    {
      slug: 'annual-forecast',
      nameEn: 'Annual Forecast',
      nameSi: 'වාර්ෂික අනාවැකිය',
      nameTa: 'ஆண்டு முன்னறிவிப்பு',
      descriptionEn: 'Year-ahead themes with monthly focus areas for planning.',
      descriptionSi: 'වසරේ මාතෘකා සහ මාසික අවධානය යොමු කළ යුතු ක්ෂේත්‍ර.',
      descriptionTa: 'ஆண்டின் கருப்பொருள்கள் மற்றும் மாதாந்திர கவனப் பகுதிகள்.',
      estimatedMinutes: 15,
      amount: '2490.00',
      sortOrder: 3,
    },
  ] as const;

  for (const product of products) {
    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        nameEn: product.nameEn,
        nameSi: product.nameSi,
        nameTa: product.nameTa,
        descriptionEn: product.descriptionEn,
        descriptionSi: product.descriptionSi,
        descriptionTa: product.descriptionTa,
        estimatedMinutes: product.estimatedMinutes,
        supportedLanguages: ['en', 'si', 'ta'],
        isActive: true,
        sortOrder: product.sortOrder,
      },
      create: {
        slug: product.slug,
        nameEn: product.nameEn,
        nameSi: product.nameSi,
        nameTa: product.nameTa,
        descriptionEn: product.descriptionEn,
        descriptionSi: product.descriptionSi,
        descriptionTa: product.descriptionTa,
        estimatedMinutes: product.estimatedMinutes,
        supportedLanguages: ['en', 'si', 'ta'],
        isActive: true,
        sortOrder: product.sortOrder,
      },
    });

    await prisma.productPrice.updateMany({
      where: { productId: saved.id, isCurrent: true },
      data: { isCurrent: false },
    });

    await prisma.productPrice.create({
      data: {
        productId: saved.id,
        currency: 'LKR',
        amount: product.amount,
        isCurrent: true,
      },
    });
  }

  const promos = [
    {
      code: 'WELCOME10',
      name: 'Welcome 10% off',
      discountType: 'PERCENT' as const,
      discountValue: '10',
      perCustomerLimit: 1,
      maxRedemptions: 1000,
    },
    {
      code: 'FLAT500',
      name: 'Flat LKR 500 off',
      discountType: 'FIXED' as const,
      discountValue: '500',
      minOrderAmount: '1000',
      perCustomerLimit: 3,
      maxRedemptions: 500,
    },
  ];

  for (const promo of promos) {
    await prisma.promotion.upsert({
      where: { code: promo.code },
      update: {
        name: promo.name,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderAmount: 'minOrderAmount' in promo ? promo.minOrderAmount : null,
        maxRedemptions: promo.maxRedemptions,
        perCustomerLimit: promo.perCustomerLimit,
        isActive: true,
      },
      create: {
        code: promo.code,
        name: promo.name,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderAmount: 'minOrderAmount' in promo ? promo.minOrderAmount : null,
        maxRedemptions: promo.maxRedemptions,
        perCustomerLimit: promo.perCustomerLimit,
        isActive: true,
      },
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@taraka.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin1234!';
  const resetAdminPassword = process.env.SEED_RESET_ADMIN_PASSWORD === 'true';
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.CONTENT,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      ...(resetAdminPassword ? { passwordHash } : {}),
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: UserRole.CONTENT,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          fullName: 'Taraka Content Admin',
          preferredLanguage: 'en',
        },
      },
    },
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Seed admin: ${adminEmail} (password from SEED_ADMIN_PASSWORD or default)`);
  }

  const packages = [
    {
      code: 'starter',
      nameEn: 'Starter Package',
      nameSi: 'ආරම්භක පැකේජය',
      nameTa: 'தொடக்க தொகுப்பு',
      descriptionEn: 'Monthly starter quotas for baby names, porondam, and horoscopes.',
      descriptionSi: 'ළදරු නම්, පොරොන්දම් සහ හඳහන් සඳහා මාසික ආරම්භක ගාස්තු.',
      priceLkr: '500.00',
      babyNamesQuota: 3,
      porondamQuota: 2,
      horoscopeQuota: 2,
      dreamInterpretationQuota: 5,
      sortOrder: 1,
    },
    {
      code: 'medium',
      nameEn: 'Medium Package',
      nameSi: 'මධ්‍යම පැකේජය',
      nameTa: 'இடைநிலை தொகுப்பு',
      descriptionEn: 'Balanced monthly quotas for regular use.',
      descriptionSi: 'නිතිපතා භාවිතය සඳහා සමබර මාසික ගාස්තු.',
      priceLkr: '990.00',
      babyNamesQuota: 5,
      porondamQuota: 4,
      horoscopeQuota: 3,
      dreamInterpretationQuota: 10,
      sortOrder: 2,
    },
    {
      code: 'advanced',
      nameEn: 'Advanced Package',
      nameSi: 'උසස් පැකේජය',
      nameTa: 'மேம்பட்ட தொகுப்பு',
      descriptionEn: 'Highest monthly quotas for power users.',
      descriptionSi: 'උපරිම මාසික ගාස්තු — වැඩි භාවිතයට.',
      priceLkr: '1990.00',
      babyNamesQuota: 10,
      porondamQuota: 10,
      horoscopeQuota: 10,
      dreamInterpretationQuota: 30,
      sortOrder: 3,
    },
  ] as const;

  for (const pkg of packages) {
    await prisma.subscriptionPackage.upsert({
      where: { code: pkg.code },
      update: {
        nameEn: pkg.nameEn,
        nameSi: pkg.nameSi,
        nameTa: pkg.nameTa,
        descriptionEn: pkg.descriptionEn,
        descriptionSi: pkg.descriptionSi,
        priceLkr: pkg.priceLkr,
        babyNamesQuota: pkg.babyNamesQuota,
        porondamQuota: pkg.porondamQuota,
        horoscopeQuota: pkg.horoscopeQuota,
        dreamInterpretationQuota: pkg.dreamInterpretationQuota,
        durationDays: 30,
        isActive: true,
        sortOrder: pkg.sortOrder,
      },
      create: {
        code: pkg.code,
        nameEn: pkg.nameEn,
        nameSi: pkg.nameSi,
        nameTa: pkg.nameTa,
        descriptionEn: pkg.descriptionEn,
        descriptionSi: pkg.descriptionSi,
        priceLkr: pkg.priceLkr,
        babyNamesQuota: pkg.babyNamesQuota,
        porondamQuota: pkg.porondamQuota,
        horoscopeQuota: pkg.horoscopeQuota,
        dreamInterpretationQuota: pkg.dreamInterpretationQuota,
        durationDays: 30,
        isActive: true,
        sortOrder: pkg.sortOrder,
      },
    });
  }

  const bankCount = await prisma.bankAccount.count();
  if (bankCount === 0) {
    await prisma.bankAccount.createMany({
      data: [
        {
          bankName: process.env.BANK_NAME || 'Commercial Bank',
          accountHolder: process.env.BANK_ACCOUNT_NAME || 'W.U.M. De Zoysa',
          accountNumber: process.env.BANK_ACCOUNT_NUMBER || '111222554785',
          branch: process.env.BANK_BRANCH || 'Kuruwita',
          isActive: true,
          sortOrder: 1,
        },
        {
          bankName: 'Bank of Ceylon',
          accountHolder: 'Taraka Astrology Services',
          accountNumber: '7001234567',
          branch: 'Colombo',
          isActive: true,
          sortOrder: 2,
        },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

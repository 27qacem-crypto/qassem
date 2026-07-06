import { PrismaClient, AccountType, AccountNature, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ERP System...');

  // 1. Create Company
  const company = await prisma.company.upsert({
    where: { taxNumber: '123456789' },
    update: {},
    create: {
      nameAr: 'الشركة الافتراضية',
      nameEn: 'Default Company',
      taxNumber: '123456789',
      commercialRegister: 'CR123456',
      currency: 'EGP',
      fiscalYearStart: new Date('2024-01-01'),
    },
  });

  // 2. Create Branch
  const branch = await prisma.branch.upsert({
    where: { id: 'default-branch' },
    update: {},
    create: {
      id: 'default-branch',
      nameAr: 'الفرع الرئيسي',
      nameEn: 'Main Branch',
      isMain: true,
      companyId: company.id,
    },
  });

  // 3. Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      email: 'admin@erp.com',
      passwordHash: '$2b$10$dummyhash', // Will be updated by auth
      nameAr: 'مدير النظام',
      nameEn: 'System Admin',
      role: UserRole.SUPER_ADMIN,
      companyId: company.id,
      branchId: branch.id,
    },
  });

  // 4. Create Standard Chart of Accounts (Egyptian Standard)
  const accounts = await createChartOfAccounts(company.id);
  console.log(`✅ Created ${accounts.length} accounts`);

  // 5. Create Default Cash Register
  const cashAccount = await prisma.account.findFirst({
    where: { code: '111', companyId: company.id },
  });

  if (cashAccount) {
    await prisma.cashRegister.upsert({
      where: { id: 'main-cash' },
      update: {},
      create: {
        id: 'main-cash',
        nameAr: 'الخزينة الرئيسية',
        nameEn: 'Main Cash Register',
        branchId: branch.id,
        accountId: cashAccount.id,
        companyId: company.id,
        isMain: true,
        openingBalance: 0,
        currentBalance: 0,
      },
    });
  }

  // 6. Create Admin Permissions
  await createPermissions();
  console.log('✅ Created permissions and admin role');

  // 7. Create Basic Units of Measure
  await createUnitsOfMeasure(company.id);
  console.log('✅ Created units of measure');

  console.log('🎉 Seeding complete!');
}

async function createChartOfAccounts(companyId: string) {
  const accounts: Array<{
    code: string;
    nameAr: string;
    type: AccountType;
    nature: AccountNature;
    level: number;
    parentCode?: string;
    isDetail: boolean;
    allowManualEntry: boolean;
  }> = [
    // ===== 1- أصول (ASSETS) =====
    { code: '1', nameAr: 'الأصول', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 1, isDetail: false, allowManualEntry: false },
    { code: '11', nameAr: 'الأصول المتداولة', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 2, parentCode: '1', isDetail: false, allowManualEntry: false },
    { code: '111', nameAr: 'النقدية بالخزينة', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '11', isDetail: true, allowManualEntry: true },
    { code: '112', nameAr: 'النقدية بالبنوك', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '11', isDetail: false, allowManualEntry: false },
    { code: '1121', nameAr: 'البنك الأهلي المصري', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 4, parentCode: '112', isDetail: true, allowManualEntry: true },
    { code: '1122', nameAr: 'بنك مصر', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 4, parentCode: '112', isDetail: true, allowManualEntry: true },
    { code: '1123', nameAr: 'فودافون كاش', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 4, parentCode: '112', isDetail: true, allowManualEntry: true },
    { code: '113', nameAr: 'شيكات تحت التحصيل', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '11', isDetail: true, allowManualEntry: true },
    { code: '114', nameAr: 'حسابات المدينون', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '11', isDetail: false, allowManualEntry: false },
    { code: '1141', nameAr: 'عملاء', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 4, parentCode: '114', isDetail: true, allowManualEntry: true },
    { code: '1142', nameAr: 'أوراق قبض', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 4, parentCode: '114', isDetail: true, allowManualEntry: true },
    { code: '115', nameAr: 'المخزون', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '11', isDetail: false, allowManualEntry: false },
    { code: '1151', nameAr: 'بضاعة بالمخازن', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 4, parentCode: '115', isDetail: true, allowManualEntry: true },
    { code: '1152', nameAr: 'مواد خام', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 4, parentCode: '115', isDetail: true, allowManualEntry: true },
    { code: '1153', nameAr: 'مهمات وتعبئة', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 4, parentCode: '115', isDetail: true, allowManualEntry: true },
    { code: '116', nameAr: 'أصول متداولة أخرى', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '11', isDetail: true, allowManualEntry: true },

    { code: '12', nameAr: 'الأصول الثابتة', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 2, parentCode: '1', isDetail: false, allowManualEntry: false },
    { code: '121', nameAr: 'الأراضي', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '12', isDetail: true, allowManualEntry: true },
    { code: '122', nameAr: 'المباني', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '12', isDetail: true, allowManualEntry: true },
    { code: '123', nameAr: 'الآلات والمعدات', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '12', isDetail: true, allowManualEntry: true },
    { code: '124', nameAr: 'السيارات', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '12', isDetail: true, allowManualEntry: true },
    { code: '125', nameAr: 'أثاث ومفروشات', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '12', isDetail: true, allowManualEntry: true },
    { code: '126', nameAr: 'أجهزة حاسب آلي', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '12', isDetail: true, allowManualEntry: true },
    { code: '127', nameAr: 'مجمع الإهلاك', type: AccountType.ASSET, nature: AccountNature.CREDIT, level: 3, parentCode: '12', isDetail: true, allowManualEntry: true },
    { code: '128', nameAr: 'أصول ثابتة أخرى', type: AccountType.ASSET, nature: AccountNature.DEBIT, level: 3, parentCode: '12', isDetail: true, allowManualEntry: true },

    // ===== 2- خصوم (LIABILITIES) =====
    { code: '2', nameAr: 'الخصوم', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 1, isDetail: false, allowManualEntry: false },
    { code: '21', nameAr: 'الخصوم المتداولة', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 2, parentCode: '2', isDetail: false, allowManualEntry: false },
    { code: '211', nameAr: 'حسابات الدائنون', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 3, parentCode: '21', isDetail: false, allowManualEntry: false },
    { code: '2111', nameAr: 'الموردون', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 4, parentCode: '211', isDetail: true, allowManualEntry: true },
    { code: '2112', nameAr: 'أوراق دفع', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 4, parentCode: '211', isDetail: true, allowManualEntry: true },
    { code: '212', nameAr: 'المرتبات والأجور', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 3, parentCode: '21', isDetail: true, allowManualEntry: true },
    { code: '213', nameAr: 'التأمينات الاجتماعية', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 3, parentCode: '21', isDetail: true, allowManualEntry: true },
    { code: '214', nameAr: 'الضرائب المستحقة', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 3, parentCode: '21', isDetail: true, allowManualEntry: true },
    { code: '215', nameAr: 'ضريبة القيمة المضافة', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 3, parentCode: '21', isDetail: true, allowManualEntry: true },
    { code: '216', nameAr: 'خصوم متداولة أخرى', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 3, parentCode: '21', isDetail: true, allowManualEntry: true },

    { code: '22', nameAr: 'الخصوم طويلة الأجل', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 2, parentCode: '2', isDetail: false, allowManualEntry: false },
    { code: '221', nameAr: 'قروض بنكية', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 3, parentCode: '22', isDetail: true, allowManualEntry: true },
    { code: '222', nameAr: 'خصوم طويلة الأجل أخرى', type: AccountType.LIABILITY, nature: AccountNature.CREDIT, level: 3, parentCode: '22', isDetail: true, allowManualEntry: true },

    // ===== 3- حقوق ملكية (EQUITY) =====
    { code: '3', nameAr: 'حقوق الملكية', type: AccountType.EQUITY, nature: AccountNature.CREDIT, level: 1, isDetail: false, allowManualEntry: false },
    { code: '31', nameAr: 'رأس المال', type: AccountType.EQUITY, nature: AccountNature.CREDIT, level: 2, parentCode: '3', isDetail: true, allowManualEntry: true },
    { code: '32', nameAr: 'الاحتياطيات', type: AccountType.EQUITY, nature: AccountNature.CREDIT, level: 2, parentCode: '3', isDetail: true, allowManualEntry: true },
    { code: '33', nameAr: 'أرباح محتجزة', type: AccountType.EQUITY, nature: AccountNature.CREDIT, level: 2, parentCode: '3', isDetail: true, allowManualEntry: true },
    { code: '34', nameAr: 'صافي الأرباح / الخسائر', type: AccountType.EQUITY, nature: AccountNature.CREDIT, level: 2, parentCode: '3', isDetail: true, allowManualEntry: true },

    // ===== 4- إيرادات (REVENUE) =====
    { code: '4', nameAr: 'الإيرادات', type: AccountType.REVENUE, nature: AccountNature.CREDIT, level: 1, isDetail: false, allowManualEntry: false },
    { code: '41', nameAr: 'إيرادات المبيعات', type: AccountType.REVENUE, nature: AccountNature.CREDIT, level: 2, parentCode: '4', isDetail: false, allowManualEntry: false },
    { code: '411', nameAr: 'مبيعات نقدية', type: AccountType.REVENUE, nature: AccountNature.CREDIT, level: 3, parentCode: '41', isDetail: true, allowManualEntry: true },
    { code: '412', nameAr: 'مبيعات آجلة', type: AccountType.REVENUE, nature: AccountNature.CREDIT, level: 3, parentCode: '41', isDetail: true, allowManualEntry: true },
    { code: '413', nameAr: 'مبيعات نصف مصنعة', type: AccountType.REVENUE, nature: AccountNature.CREDIT, level: 3, parentCode: '41', isDetail: true, allowManualEntry: true },
    { code: '42', nameAr: 'إيرادات أخرى', type: AccountType.REVENUE, nature: AccountNature.CREDIT, level: 2, parentCode: '4', isDetail: true, allowManualEntry: true },
    { code: '43', nameAr: 'إيرادات خدمات', type: AccountType.REVENUE, nature: AccountNature.CREDIT, level: 2, parentCode: '4', isDetail: true, allowManualEntry: true },
    { code: '44', nameAr: 'إيرادات استثمارية', type: AccountType.REVENUE, nature: AccountNature.CREDIT, level: 2, parentCode: '4', isDetail: true, allowManualEntry: true },

    // ===== 5- مصروفات (EXPENSES) =====
    { code: '5', nameAr: 'المصروفات', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 1, isDetail: false, allowManualEntry: false },
    { code: '51', nameAr: 'تكلفة المبيعات', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 2, parentCode: '5', isDetail: false, allowManualEntry: false },
    { code: '511', nameAr: 'تكلفة بضاعة مباعة', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '51', isDetail: true, allowManualEntry: true },
    { code: '512', nameAr: 'مشتريات', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '51', isDetail: true, allowManualEntry: true },
    { code: '513', nameAr: 'مردودات المشتريات', type: AccountType.EXPENSE, nature: AccountNature.CREDIT, level: 3, parentCode: '51', isDetail: true, allowManualEntry: true },
    { code: '514', nameAr: 'مصروفات مشتريات', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '51', isDetail: true, allowManualEntry: true },
    { code: '515', nameAr: 'مردودات المبيعات', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '51', isDetail: true, allowManualEntry: true },

    { code: '52', nameAr: 'مصروفات عمومية وإدارية', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 2, parentCode: '5', isDetail: false, allowManualEntry: false },
    { code: '521', nameAr: 'رواتب وأجور', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '522', nameAr: 'تأمينات اجتماعية', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '523', nameAr: 'إيجارات', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '524', nameAr: 'كهرباء ومياه', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '525', nameAr: 'تليفونات وانترنت', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '526', nameAr: 'مصروفات سفر ونقل', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '527', nameAr: 'مصروفات دعاية وإعلان', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '528', nameAr: 'مصروفات صيانة', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '529', nameAr: 'مصروفات قانونية', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '52A', nameAr: 'مصروفات استشارات', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '52B', nameAr: 'مصروفات بنكية', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '52C', nameAr: 'عمولات تحويل', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },
    { code: '52D', nameAr: 'مصروفات عمومية أخرى', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '52', isDetail: true, allowManualEntry: true },

    { code: '53', nameAr: 'مصروفات إهلاك', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 2, parentCode: '5', isDetail: false, allowManualEntry: false },
    { code: '531', nameAr: 'إهلاك المباني', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '53', isDetail: true, allowManualEntry: true },
    { code: '532', nameAr: 'إهلاك الآلات والمعدات', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '53', isDetail: true, allowManualEntry: true },
    { code: '533', nameAr: 'إهلاك السيارات', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '53', isDetail: true, allowManualEntry: true },
    { code: '534', nameAr: 'إهلاك الأثاث', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '53', isDetail: true, allowManualEntry: true },
    { code: '535', nameAr: 'إهلاك أجهزة حاسب', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 3, parentCode: '53', isDetail: true, allowManualEntry: true },

    { code: '54', nameAr: 'مصروفات ضريبية', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 2, parentCode: '5', isDetail: true, allowManualEntry: true },
    { code: '55', nameAr: 'مصروفات تمويل', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 2, parentCode: '5', isDetail: true, allowManualEntry: true },
    { code: '56', nameAr: 'مصروفات استثنائية', type: AccountType.EXPENSE, nature: AccountNature.DEBIT, level: 2, parentCode: '5', isDetail: true, allowManualEntry: true },
  ];

  const accountMap = new Map<string, string>();

  for (const acc of accounts) {
    const created = await prisma.account.create({
      data: {
        code: acc.code,
        nameAr: acc.nameAr,
        nameEn: '',
        type: acc.type,
        nature: acc.nature,
        level: acc.level,
        parentId: acc.parentCode ? accountMap.get(acc.parentCode) : null,
        isDetail: acc.isDetail,
        allowManualEntry: acc.allowManualEntry,
        companyId,
      },
    });
    accountMap.set(acc.code, created.id);
  }

  return accounts;
}

async function createPermissions() {
  const modules = ['accounts', 'treasury', 'banks', 'inventory', 'hr', 'settings', 'reports'];
  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'PRINT'];
  const arabicNames: Record<string, string> = {
    accounts: 'الحسابات العامة',
    treasury: 'الخزينة',
    banks: 'البنوك',
    inventory: 'المخازن',
    hr: 'الموظفين',
    settings: 'الإعدادات',
    reports: 'التقارير',
  };

  for (const module of modules) {
    for (const action of actions) {
      const permission = await prisma.permission.upsert({
        where: { code: `${module}.${action.toLowerCase()}` },
        update: {},
        create: {
          code: `${module}.${action.toLowerCase()}`,
          nameAr: `${arabicNames[module]} - ${getArabicAction(action)}`,
          nameEn: `${module} ${action.toLowerCase()}`,
          module,
          action: action as any,
        },
      });

      // Grant all permissions to SUPER_ADMIN
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: UserRole.SUPER_ADMIN, permissionId: permission.id } },
        update: {},
        create: {
          role: UserRole.SUPER_ADMIN,
          permissionId: permission.id,
        },
      });

      // Grant read-only to VIEWER
      if (action === 'READ') {
        await prisma.rolePermission.upsert({
          where: { role_permissionId: { role: UserRole.VIEWER, permissionId: permission.id } },
          update: {},
          create: {
            role: UserRole.VIEWER,
            permissionId: permission.id,
          },
        });
      }
    }
  }
}

function getArabicAction(action: string): string {
  const map: Record<string, string> = {
    CREATE: 'إضافة',
    READ: 'عرض',
    UPDATE: 'تعديل',
    DELETE: 'حذف',
    APPROVE: 'اعتماد',
    PRINT: 'طباعة',
  };
  return map[action] || action;
}

async function createUnitsOfMeasure(companyId: string) {
  const units = [
    { code: 'UOM-KG', nameAr: 'كيلو جرام', symbol: 'كجم', isBase: true },
    { code: 'UOM-G', nameAr: 'جرام', symbol: 'جم', isBase: false, baseUnitCode: 'UOM-KG', factor: 0.001 },
    { code: 'UOM-TON', nameAr: 'طن', symbol: 'طن', isBase: false, baseUnitCode: 'UOM-KG', factor: 1000 },
    { code: 'UOM-PC', nameAr: 'قطعة', symbol: 'قطعة', isBase: true },
    { code: 'UOM-BOX', nameAr: 'كرتونة', symbol: 'كرتونة', isBase: false, baseUnitCode: 'UOM-PC', factor: 12 },
    { code: 'UOM-LTR', nameAr: 'لتر', symbol: 'لتر', isBase: true },
    { code: 'UOM-ML', nameAr: 'مليلتر', symbol: 'مل', isBase: false, baseUnitCode: 'UOM-LTR', factor: 0.001 },
    { code: 'UOM-M', nameAr: 'متر', symbol: 'م', isBase: true },
    { code: 'UOM-CM', nameAr: 'سنتيمتر', symbol: 'سم', isBase: false, baseUnitCode: 'UOM-M', factor: 0.01 },
  ];

  const baseUnitMap = new Map<string, string>();

  for (const unit of units) {
    if (unit.isBase || !unit.baseUnitCode) {
      const created = await prisma.unitOfMeasure.upsert({
        where: { code_companyId: { code: unit.code, companyId } },
        update: {},
        create: {
          code: unit.code,
          nameAr: unit.nameAr,
          symbol: unit.symbol,
          isBase: true,
          conversionFactor: 1,
          companyId,
        },
      });
      baseUnitMap.set(unit.code, created.id);
    }
  }

  for (const unit of units) {
    if (!unit.isBase && unit.baseUnitCode) {
      const baseId = baseUnitMap.get(unit.baseUnitCode);
      if (baseId) {
        await prisma.unitOfMeasure.upsert({
          where: { code_companyId: { code: unit.code, companyId } },
          update: {},
          create: {
            code: unit.code,
            nameAr: unit.nameAr,
            symbol: unit.symbol,
            isBase: false,
            baseUnitId: baseId,
            conversionFactor: new PrismaClient().$queryRaw`${unit.factor}` as any,
            companyId,
          },
        });
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

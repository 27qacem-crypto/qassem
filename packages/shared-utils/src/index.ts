export function generateCode(prefix: string, num: number, pad = 5): string {
  return `${prefix}-${String(num).padStart(pad, '0')}`;
}

export function isValidEgyptianTaxId(taxId: string): boolean {
  return /^\d{9,15}$/.test(taxId);
}

export function getArabicAccountType(type: string): string {
  const map: Record<string, string> = {
    ASSET: 'أصول',
    LIABILITY: 'خصوم',
    EQUITY: 'حقوق ملكية',
    REVENUE: 'إيرادات',
    EXPENSE: 'مصروفات',
  };
  return map[type] || type;
}

export function getArabicAccountNature(nature: string): string {
  const map: Record<string, string> = {
    DEBIT: 'مدين',
    CREDIT: 'دائن',
  };
  return map[nature] || nature;
}

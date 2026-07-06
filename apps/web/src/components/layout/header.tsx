'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/': 'لوحة التحكم',
  '/accounts': 'شجرة الحسابات',
  '/journal-entries': 'قيود اليومية',
  '/treasury/cash-in': 'سندات القبض',
  '/treasury/cash-out': 'سندات الصرف',
  '/treasury/daily-closure': 'تقفيل اليومية',
  '/banks': 'الحسابات البنكية',
  '/banks/checks': 'الشيكات',
  '/vodafone-cash': 'فودافون كاش',
  '/inventory/items': 'الأصناف',
  '/inventory/warehouses': 'المخازن',
  '/inventory/movements': 'حركات المخازن',
  '/hr/users': 'المستخدمين',
  '/hr/permissions': 'الصلاحيات',
  '/reports/trial-balance': 'ميزان المراجعة',
  '/reports/income-statement': 'قائمة الدخل',
  '/reports/balance-sheet': 'الميزانية العمومية',
  '/settings': 'الإعدادات',
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'نظام المحاسبة';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث..."
            className="input-field pr-10 pl-4 py-2 w-64"
          />
        </div>
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}

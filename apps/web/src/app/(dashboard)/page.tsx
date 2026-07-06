'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Banknote,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const stats = [
  {
    label: 'رصيد الخزينة',
    value: '٠ ج.م',
    change: '+١٢٪',
    trend: 'up',
    icon: Wallet,
    color: 'text-green-600 bg-green-50',
  },
  {
    label: 'إجمالي المبيعات',
    value: '٠ ج.م',
    change: '+٨٪',
    trend: 'up',
    icon: TrendingUp,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    label: 'إجمالي المشتريات',
    value: '٠ ج.م',
    change: '-٣٪',
    trend: 'down',
    icon: TrendingDown,
    color: 'text-orange-600 bg-orange-50',
  },
  {
    label: 'إجمالي المخزون',
    value: '٠ ج.م',
    change: '+٢٪',
    trend: 'up',
    icon: Package,
    color: 'text-purple-600 bg-purple-50',
  },
  {
    label: 'الأرصدة البنكية',
    value: '٠ ج.م',
    change: '٠٪',
    trend: 'up',
    icon: Banknote,
    color: 'text-indigo-600 bg-indigo-50',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          مرحباً، {user?.nameAr || 'مستخدم'}
        </h2>
        <p className="text-gray-500 mt-1">نظرة عامة على النظام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span
                className={`flex items-center text-sm font-medium gap-1 ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
                {stat.trend === 'up' ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">آخر القيود</h3>
          <p className="text-gray-400 text-center py-8">لا توجد قيود بعد</p>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">آخر الحركات</h3>
          <p className="text-gray-400 text-center py-8">لا توجد حركات بعد</p>
        </div>
      </div>
    </div>
  );
}

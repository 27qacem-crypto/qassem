'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  Calculator,
  BookOpen,
  FileText,
  Wallet,
  Building2,
  Smartphone,
  Package,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  {
    label: 'لوحة التحكم',
    icon: <LayoutDashboard size={20} />,
    href: '/',
  },
  {
    label: 'الحسابات العامة',
    icon: <Calculator size={20} />,
    children: [
      { label: 'شجرة الحسابات', href: '/accounts' },
      { label: 'قيود اليومية', href: '/journal-entries' },
    ],
  },
  {
    label: 'الخزينة',
    icon: <Wallet size={20} />,
    children: [
      { label: 'سندات القبض', href: '/treasury/cash-in' },
      { label: 'سندات الصرف', href: '/treasury/cash-out' },
      { label: 'تقفيل اليومية', href: '/treasury/daily-closure' },
    ],
  },
  {
    label: 'البنوك وفودافون كاش',
    icon: <Building2 size={20} />,
    children: [
      { label: 'الحسابات البنكية', href: '/banks' },
      { label: 'الشيكات', href: '/banks/checks' },
      { label: 'فودافون كاش', href: '/vodafone-cash' },
    ],
  },
  {
    label: 'المخازن',
    icon: <Package size={20} />,
    children: [
      { label: 'الأصناف', href: '/inventory/items' },
      { label: 'المخازن', href: '/inventory/warehouses' },
      { label: 'حركات المخازن', href: '/inventory/movements' },
    ],
  },
  {
    label: 'الموظفين',
    icon: <Users size={20} />,
    children: [
      { label: 'المستخدمين', href: '/hr/users' },
      { label: 'الصلاحيات', href: '/hr/permissions' },
    ],
  },
  {
    label: 'التقارير',
    icon: <FileText size={20} />,
    children: [
      { label: 'ميزان المراجعة', href: '/reports/trial-balance' },
      { label: 'قائمة الدخل', href: '/reports/income-statement' },
      { label: 'الميزانية العمومية', href: '/reports/balance-sheet' },
    ],
  },
  {
    label: 'الإعدادات',
    icon: <Settings size={20} />,
    href: '/settings',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="w-72 h-screen bg-white border-l border-gray-200 fixed right-0 top-0 flex flex-col z-50">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-700">نظام المحاسبة</h1>
        <p className="text-xs text-gray-500 mt-1">ERP System</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          if (item.children) {
            const isOpen = openMenus[item.label] ?? true;
            const hasActiveChild = item.children.some((c) => isActive(c.href));

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    'sidebar-link w-full',
                    hasActiveChild ? 'sidebar-link-active' : 'sidebar-link-inactive',
                  )}
                >
                  {item.icon}
                  <span className="flex-1 text-right">{item.label}</span>
                  {isOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
                </button>
                {isOpen && (
                  <div className="mr-8 space-y-1 mt-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'sidebar-link text-sm pr-4',
                          isActive(child.href)
                            ? 'sidebar-link-active'
                            : 'sidebar-link-inactive',
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'sidebar-link',
                isActive(item.href!) ? 'sidebar-link-active' : 'sidebar-link-inactive',
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="font-bold text-primary-700">
              {user?.nameAr?.charAt(0) || 'م'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.nameAr || 'مستخدم'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="sidebar-link sidebar-link-inactive w-full text-red-600 hover:bg-red-50"
        >
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import { Download, Printer, Scale } from 'lucide-react';

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['balance-sheet', asOfDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (asOfDate) params.set('asOfDate', asOfDate);
      return apiClient.get(`/reports/balance-sheet?${params}`).then((r: any) => r.data || r);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="label">تاريخ الإعداد</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> طباعة
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download size={16} /> تصدير
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-md font-semibold text-blue-600">الأصول</h4>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
            ) : (report?.assets || []).length === 0 ? (
              <div className="text-center py-8 text-gray-400">لا توجد أصول</div>
            ) : (
              <div className="space-y-2">
                {(report?.assets || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">{item.nameAr}</span>
                    <span className="text-sm font-medium">{formatCurrency(item.balance)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 font-bold border-t mt-2">
                  <span>إجمالي الأصول</span>
                  <span className="text-blue-600">{formatCurrency(report?.totals?.totalAssets || 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-md font-semibold text-orange-600">الخصوم</h4>
            </div>
            <div className="p-4">
              {(report?.liabilities || []).length === 0 ? (
                <div className="text-center py-8 text-gray-400">لا توجد خصوم</div>
              ) : (
                <div className="space-y-2">
                  {(report?.liabilities || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">{item.nameAr}</span>
                      <span className="text-sm font-medium">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-2 font-bold border-t mt-2">
                    <span>إجمالي الخصوم</span>
                    <span className="text-orange-600">{formatCurrency(report?.totals?.totalLiabilities || 0)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-md font-semibold text-green-600">حقوق الملكية</h4>
            </div>
            <div className="p-4">
              {(report?.equity || []).length === 0 ? (
                <div className="text-center py-8 text-gray-400">لا توجد حقوق ملكية</div>
              ) : (
                <div className="space-y-2">
                  {(report?.equity || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">{item.nameAr}</span>
                      <span className="text-sm font-medium">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6">
          <div className="flex items-center justify-between text-lg font-bold">
            <div className="flex items-center gap-2">
              <Scale size={24} className="text-primary-600" />
              <span>إجمالي الأصول</span>
            </div>
            <span className="text-primary-600">
              {formatCurrency(report?.totals?.totalAssets || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-lg font-bold mt-3">
            <div className="flex items-center gap-2">
              <Scale size={24} className="text-primary-600" />
              <span>إجمالي الخصوم + حقوق الملكية</span>
            </div>
            <span className="text-primary-600">
              {formatCurrency((report?.totals?.totalLiabilities || 0) + (report?.totals?.totalEquity || 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import { Download, Printer, TrendingUp } from 'lucide-react';

export default function IncomeStatementPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['income-statement', fromDate, toDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      return apiClient.get(`/reports/income-statement?${params}`).then((r: any) => r.data || r);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="label">من تاريخ</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">إلى تاريخ</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
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

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp size={20} className="text-green-500" />
          <div>
            <h3 className="text-lg font-semibold">قائمة الدخل</h3>
            <p className="text-sm text-gray-500 mt-1">
              {fromDate && `من ${fromDate} `}
              {toDate && `إلى ${toDate}`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
        ) : (
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-md font-semibold text-green-600 mb-3 pb-2 border-b">
                الإيرادات
              </h4>
              {(report?.revenues || []).length === 0 ? (
                <p className="text-gray-400 text-sm">لا توجد إيرادات</p>
              ) : (
                (report?.revenues || []).map((rev: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">{rev.nameAr}</span>
                    <span className="text-sm font-medium">{formatCurrency(rev.amount)}</span>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between py-2 font-bold border-t mt-2">
                <span>إجمالي الإيرادات</span>
                <span className="text-green-600">
                  {formatCurrency(report?.totals?.totalRevenue || 0)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold text-red-600 mb-3 pb-2 border-b">
                المصروفات
              </h4>
              {(report?.expenses || []).length === 0 ? (
                <p className="text-gray-400 text-sm">لا توجد مصروفات</p>
              ) : (
                (report?.expenses || []).map((exp: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">{exp.nameAr}</span>
                    <span className="text-sm font-medium">{formatCurrency(exp.amount)}</span>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between py-2 font-bold border-t mt-2">
                <span>إجمالي المصروفات</span>
                <span className="text-red-600">
                  {formatCurrency(report?.totals?.totalExpenses || 0)}
                </span>
              </div>
            </div>

            <div className="border-t-2 pt-4">
              <div className="flex items-center justify-between py-3 text-lg font-bold">
                <span>صافي الدخل / الخسارة</span>
                <span
                  className={
                    (report?.totals?.netIncome || 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {formatCurrency(report?.totals?.netIncome || 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

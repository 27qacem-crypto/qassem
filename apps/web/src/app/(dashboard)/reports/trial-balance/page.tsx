'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import { Download, Printer } from 'lucide-react';

export default function TrialBalancePage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['trial-balance', fromDate, toDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      return apiClient.get(`/reports/trial-balance?${params}`).then((r: any) => r.data || r);
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
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold">ميزان المراجعة</h3>
          <p className="text-sm text-gray-500 mt-1">
            {fromDate && `من ${fromDate} `}
            {toDate && `إلى ${toDate}`}
            {!fromDate && !toDate && 'جميع الفترات'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">الكود</th>
                <th className="table-header text-right">الحساب</th>
                <th className="table-header">مدين</th>
                <th className="table-header">دائن</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    جاري التحميل...
                  </td>
                </tr>
              ) : report?.data?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                (report?.data || []).map((row: any, idx: number) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs text-gray-500">{row.code}</td>
                    <td className="table-cell font-medium">{row.nameAr}</td>
                    <td className="table-cell">
                      {row.closingDebit > 0 ? formatCurrency(row.closingDebit) : '-'}
                    </td>
                    <td className="table-cell">
                      {row.closingCredit > 0 ? formatCurrency(row.closingCredit) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {report?.totals && (
              <tfoot>
                <tr className="border-t bg-gray-100 font-bold">
                  <td className="table-header" colSpan={2}>الإجمالي</td>
                  <td className="table-cell">{formatCurrency(report.totals.closingDebit)}</td>
                  <td className="table-cell">{formatCurrency(report.totals.closingCredit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

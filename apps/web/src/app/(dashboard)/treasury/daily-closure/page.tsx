'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Lock, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function DailyClosurePage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    actualBalance: 0,
    cashRegisterId: '',
    notes: '',
  });
  const [statementFilter, setStatementFilter] = useState({ cashRegisterId: '', fromDate: '', toDate: '' });

  const { data: cashRegisters } = useQuery({
    queryKey: ['cash-registers'],
    queryFn: () => apiClient.get('/cash-registers').then((r: any) => r.data || r),
  });

  const { data: closures } = useQuery({
    queryKey: ['daily-closures'],
    queryFn: () => apiClient.get('/daily-closures').then((r: any) => r.data || r),
  });

  const { data: statement } = useQuery({
    queryKey: ['register-statement', statementFilter],
    queryFn: () => {
      if (!statementFilter.cashRegisterId) return null;
      const params = new URLSearchParams();
      if (statementFilter.fromDate) params.set('fromDate', statementFilter.fromDate);
      if (statementFilter.toDate) params.set('toDate', statementFilter.toDate);
      return apiClient.get(`/daily-closures/statement/${statementFilter.cashRegisterId}?${params}`).then((r: any) => r.data || r);
    },
    enabled: showStatement,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/daily-closures', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-closures'] });
      toast.success('تم تقفيل اليومية بنجاح');
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err?.message || 'فشل تقفيل اليومية'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      date: new Date(form.date),
      actualBalance: form.actualBalance,
      cashRegisterId: form.cashRegisterId,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock size={24} className="text-primary-600" />
          <h2 className="text-xl font-bold">تقفيل اليومية</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowStatement(true); setShowForm(false); }} className="btn-secondary flex items-center gap-2">
            <FileText size={16} /> كشف حساب
          </button>
          <button onClick={() => { setShowForm(true); setShowStatement(false); }} className="btn-primary flex items-center gap-2">
            <Lock size={16} /> تقفيل يومية
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-6 max-w-lg">
          <h3 className="text-lg font-semibold mb-4">تقفيل يومية جديد</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">الخزينة</label>
              <select value={form.cashRegisterId} onChange={(e) => setForm({ ...form, cashRegisterId: e.target.value })} className="input-field" required>
                <option value="">اختر الخزينة</option>
                {(cashRegisters || []).map((cr: any) => (
                  <option key={cr.id} value={cr.id}>{cr.nameAr} - الرصيد: {formatCurrency(cr.currentBalance)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">التاريخ</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">الرصيد الفعلي</label>
              <input type="number" step="0.01" value={form.actualBalance || ''} onChange={(e) => setForm({ ...form, actualBalance: Number(e.target.value) })} className="input-field" required />
            </div>
            <div>
              <label className="label">ملاحظات</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
            </div>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'جاري...' : 'تقفيل اليومية'}
            </button>
          </form>
        </div>
      )}

      {showStatement && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">كشف حساب خزينة</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="label">الخزينة</label>
              <select value={statementFilter.cashRegisterId} onChange={(e) => setStatementFilter({ ...statementFilter, cashRegisterId: e.target.value })} className="input-field">
                <option value="">اختر الخزينة</option>
                {(cashRegisters || []).map((cr: any) => (
                  <option key={cr.id} value={cr.id}>{cr.nameAr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">من تاريخ</label>
              <input type="date" value={statementFilter.fromDate} onChange={(e) => setStatementFilter({ ...statementFilter, fromDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">إلى تاريخ</label>
              <input type="date" value={statementFilter.toDate} onChange={(e) => setStatementFilter({ ...statementFilter, toDate: e.target.value })} className="input-field" />
            </div>
          </div>

          {statement && (
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">الخزينة: <span className="font-medium">{statement.cashRegister?.nameAr}</span></p>
                <p className="text-sm text-gray-500">الرصيد الافتتاحي: <span className="font-medium">{formatCurrency(statement.cashRegister?.openingBalance)}</span></p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header">التاريخ</th>
                    <th className="table-header">رقم السند</th>
                    <th className="table-header">البيان</th>
                    <th className="table-header">قبض</th>
                    <th className="table-header">صرف</th>
                    <th className="table-header">الرصيد</th>
                  </tr>
                </thead>
                <tbody>
                  {(statement.statement || []).length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">لا توجد حركات</td></tr>
                  ) : (
                    (statement.statement || []).map((s: any, idx: number) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="table-cell">{formatDate(s.date)}</td>
                        <td className="table-cell font-mono text-xs">{s.voucherNumber}</td>
                        <td className="table-cell">{s.description}</td>
                        <td className="table-cell text-green-600">{s.inAmount > 0 ? formatCurrency(s.inAmount) : '-'}</td>
                        <td className="table-cell text-red-600">{s.outAmount > 0 ? formatCurrency(s.outAmount) : '-'}</td>
                        <td className="table-cell font-medium">{formatCurrency(s.balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Lock size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">سجل تقفيل اليومية</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-header">التاريخ</th>
              <th className="table-header">الخزينة</th>
              <th className="table-header">الرصيد الافتتاحي</th>
              <th className="table-header">إجمالي القبض</th>
              <th className="table-header">إجمالي الصرف</th>
              <th className="table-header">الرصيد المتوقع</th>
              <th className="table-header">الرصيد الفعلي</th>
              <th className="table-header">الفرق</th>
            </tr>
          </thead>
          <tbody>
            {(closures || []).length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">لم يتم تقفيل أي يومية بعد</td></tr>
            ) : (
              (closures || []).map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="table-cell">{formatDate(c.date)}</td>
                  <td className="table-cell">{c.cashRegister?.nameAr}</td>
                  <td className="table-cell">{formatCurrency(c.openingBalance)}</td>
                  <td className="table-cell text-green-600">{formatCurrency(c.totalIn)}</td>
                  <td className="table-cell text-red-600">{formatCurrency(c.totalOut)}</td>
                  <td className="table-cell">{formatCurrency(c.expectedBalance)}</td>
                  <td className="table-cell">{formatCurrency(c.actualBalance)}</td>
                  <td className={`table-cell font-medium ${c.variance !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(c.variance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

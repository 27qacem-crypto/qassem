'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Plus, CheckCircle, XCircle, ArrowUpFromLine } from 'lucide-react';
import { toast } from 'sonner';

export default function CashOutPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    payeePayerName: '',
    payeePayerType: 'SUPPLIER',
    reference: '',
    notes: '',
    cashRegisterId: '',
    accountId: '',
  });

  const { data: vouchers } = useQuery({
    queryKey: ['vouchers', 'CASH_OUT'],
    queryFn: () => apiClient.get('/vouchers?type=CASH_OUT').then((r: any) => r.data || r),
  });

  const { data: cashRegisters } = useQuery({
    queryKey: ['cash-registers'],
    queryFn: () => apiClient.get('/cash-registers').then((r: any) => r.data || r),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts-expense'],
    queryFn: () => apiClient.get('/accounts?type=EXPENSE').then((r: any) => r.data || r),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/vouchers', { ...data, type: 'CASH_OUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      toast.success('تم إنشاء سند الصرف بنجاح');
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err?.message || 'فشل إنشاء السند'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/vouchers/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      toast.success('تم اعتماد السند');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-50 text-yellow-600',
      APPROVED: 'bg-green-50 text-green-600',
      REJECTED: 'bg-red-50 text-red-600',
      CANCELLED: 'bg-gray-50 text-gray-500',
    };
    const labels: Record<string, string> = {
      PENDING: 'معلق',
      APPROVED: 'معتمد',
      REJECTED: 'مرفوض',
      CANCELLED: 'ملغي',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || ''}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowUpFromLine size={24} className="text-red-500" />
          <h2 className="text-xl font-bold">سندات الصرف</h2>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          سند صرف جديد
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">إضافة سند صرف</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">التاريخ</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">المبلغ</label>
              <input type="number" step="0.01" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="input-field" required />
            </div>
            <div>
              <label className="label">البيان</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">الخزينة</label>
              <select value={form.cashRegisterId} onChange={(e) => setForm({ ...form, cashRegisterId: e.target.value })} className="input-field" required>
                <option value="">اختر الخزينة</option>
                {(cashRegisters || []).map((cr: any) => (
                  <option key={cr.id} value={cr.id}>{cr.nameAr} - {formatCurrency(cr.currentBalance)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">الحساب المقابل (مصروف)</label>
              <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className="input-field" required>
                <option value="">اختر الحساب</option>
                {(accounts || []).map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">الصرف لـ</label>
              <input type="text" value={form.payeePayerName} onChange={(e) => setForm({ ...form, payeePayerName: e.target.value })} className="input-field" placeholder="اسم المستفيد" />
            </div>
            <div>
              <label className="label">النوع</label>
              <select value={form.payeePayerType} onChange={(e) => setForm({ ...form, payeePayerType: e.target.value })} className="input-field">
                <option value="SUPPLIER">مورد</option>
                <option value="EMPLOYEE">موظف</option>
                <option value="CUSTOMER">عميل</option>
                <option value="OTHER">أخرى</option>
              </select>
            </div>
            <div>
              <label className="label">رقم المستند</label>
              <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="input-field" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'جاري...' : 'حفظ السند'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-header">رقم السند</th>
              <th className="table-header">التاريخ</th>
              <th className="table-header">البيان</th>
              <th className="table-header">المبلغ</th>
              <th className="table-header">الخزينة</th>
              <th className="table-header">الصرف لـ</th>
              <th className="table-header">الحالة</th>
              <th className="table-header">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(vouchers || []).length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">لا توجد سندات صرف</td></tr>
            ) : (
              (vouchers || []).map((v: any) => (
                <tr key={v.id} className="border-t hover:bg-gray-50">
                  <td className="table-cell font-mono text-xs">{v.voucherNumber}</td>
                  <td className="table-cell">{formatDate(v.date)}</td>
                  <td className="table-cell max-w-xs truncate">{v.description}</td>
                  <td className="table-cell font-medium text-red-600">{formatCurrency(v.amountBase)}</td>
                  <td className="table-cell">{v.cashRegister?.nameAr}</td>
                  <td className="table-cell">{v.payeePayerName || '-'}</td>
                  <td className="table-cell">{statusBadge(v.status)}</td>
                  <td className="table-cell">
                    {v.status === 'PENDING' && (
                      <button onClick={() => approveMutation.mutate(v.id)} className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="اعتماد">
                        <CheckCircle size={15} />
                      </button>
                    )}
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

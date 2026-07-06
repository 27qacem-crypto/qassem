'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Plus, Eye, CheckCircle, XCircle, RotateCcw, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface JournalLine {
  id?: string;
  accountId: string;
  accountName?: string;
  description?: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  lines: JournalLine[];
  createdBy?: { id: string; nameAr: string };
  postedBy?: { id: string; nameAr: string };
  createdAt: string;
}

export default function JournalEntriesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [filter, setFilter] = useState({ status: '', search: '' });

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [{ accountId: '', description: '', debit: 0, credit: 0 }] as JournalLine[],
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal-entries', filter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.search) params.set('search', filter.search);
      return apiClient.get(`/journal-entries?${params}`).then((r: any) => r.data || r);
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts-list'],
    queryFn: () => apiClient.get('/accounts?isDetail=true').then((r: any) => r.data || r),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/journal-entries', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('تم إنشاء قيد اليومية بنجاح');
      resetForm();
    },
    onError: (err: any) => toast.error(err?.message || 'فشل إنشاء القيد'),
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/journal-entries/${id}/post`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('تم ترحيل القيد بنجاح');
    },
    onError: (err: any) => toast.error(err?.message || 'فشل ترحيل القيد'),
  });

  const reverseMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/journal-entries/${id}/reverse`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('تم عكس القيد بنجاح');
    },
    onError: (err: any) => toast.error(err?.message || 'فشل عكس القيد'),
  });

  const addLine = () => {
    setForm({
      ...form,
      lines: [...form.lines, { accountId: '', description: '', debit: 0, credit: 0 }],
    });
  };

  const removeLine = (index: number) => {
    if (form.lines.length <= 2) return;
    setForm({
      ...form,
      lines: form.lines.filter((_, i) => i !== index),
    });
  };

  const updateLine = (index: number, field: string, value: any) => {
    const lines = [...form.lines];
    (lines[index] as any)[field] = value;
    setForm({ ...form, lines });
  };

  const resetForm = () => {
    setShowCreate(false);
    setForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      lines: [{ accountId: '', description: '', debit: 0, credit: 0 }],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      date: new Date(form.date),
      description: form.description,
      reference: form.reference || undefined,
      lines: form.lines.map((l) => ({
        accountId: l.accountId,
        description: l.description || undefined,
        debit: l.debit,
        credit: l.credit,
      })),
    });
  };

  const totalDebit = form.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-yellow-50 text-yellow-600',
      POSTED: 'bg-green-50 text-green-600',
      REVERSED: 'bg-gray-50 text-gray-500',
      CANCELLED: 'bg-red-50 text-red-600',
    };
    const labels: Record<string, string> = {
      DRAFT: 'مسودة',
      POSTED: 'مرحل',
      REVERSED: 'ملغي',
      CANCELLED: 'ملغى',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="بحث..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="input-field w-64"
          />
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="input-field w-40"
          >
            <option value="">كل الحالات</option>
            <option value="DRAFT">مسودة</option>
            <option value="POSTED">مرحل</option>
            <option value="REVERSED">ملغي</option>
          </select>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          قيد جديد
        </button>
      </div>

      {showCreate && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">إضافة قيد يومية جديد</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">التاريخ</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">البيان</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">رقم المستند</label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header w-1/3">الحساب</th>
                    <th className="table-header">بيان</th>
                    <th className="table-header w-32">مدين</th>
                    <th className="table-header w-32">دائن</th>
                    <th className="table-header w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((line, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="table-cell">
                        <select
                          value={line.accountId}
                          onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">اختر الحساب</option>
                          {(accounts || []).map((acc: any) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.nameAr}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="table-cell">
                        <input
                          type="text"
                          value={line.description || ''}
                          onChange={(e) => updateLine(idx, 'description', e.target.value)}
                          className="input-field"
                          placeholder="بيان السطر"
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          type="number"
                          step="0.01"
                          value={line.debit || ''}
                          onChange={(e) => updateLine(idx, 'debit', Number(e.target.value))}
                          className="input-field"
                          placeholder="٠"
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          type="number"
                          step="0.01"
                          value={line.credit || ''}
                          onChange={(e) => updateLine(idx, 'credit', Number(e.target.value))}
                          className="input-field"
                          placeholder="٠"
                        />
                      </td>
                      <td className="table-cell">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="text-red-400 hover:text-red-600 text-sm"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-gray-50 font-bold">
                    <td className="table-header" colSpan={2}>الإجمالي</td>
                    <td className="table-cell">{formatCurrency(totalDebit)}</td>
                    <td className="table-cell">{formatCurrency(totalCredit)}</td>
                    <td className="table-cell"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={addLine} className="btn-secondary text-sm">
                + إضافة سطر
              </button>
              {!isBalanced && totalDebit > 0 && (
                <span className="text-red-500 text-sm">
                  القيد غير متوازن (المجموع غير متساوي)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="btn-primary"
                disabled={!isBalanced || createMutation.isPending}
              >
                {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ القيد'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <FileText size={18} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">قيود اليومية</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">رقم القيد</th>
                <th className="table-header">التاريخ</th>
                <th className="table-header">البيان</th>
                <th className="table-header">المدين</th>
                <th className="table-header">الدائن</th>
                <th className="table-header">الحالة</th>
                <th className="table-header">تاريخ الإنشاء</th>
                <th className="table-header">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    جاري التحميل...
                  </td>
                </tr>
              ) : entries?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    لا توجد قيود بعد
                  </td>
                </tr>
              ) : (
                (entries || []).map((entry: JournalEntry) => (
                  <tr key={entry.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-mono text-xs">{entry.entryNumber}</td>
                    <td className="table-cell">{formatDate(entry.date)}</td>
                    <td className="table-cell max-w-xs truncate">{entry.description}</td>
                    <td className="table-cell">{formatCurrency(entry.totalDebit)}</td>
                    <td className="table-cell">{formatCurrency(entry.totalCredit)}</td>
                    <td className="table-cell">{statusBadge(entry.status)}</td>
                    <td className="table-cell text-xs text-gray-400">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedEntry(entry)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                        >
                          <Eye size={15} />
                        </button>
                        {entry.status === 'DRAFT' && (
                          <button
                            onClick={() => postMutation.mutate(entry.id)}
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded"
                            title="ترحيل"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {entry.status === 'POSTED' && (
                          <button
                            onClick={() => {
                              if (confirm('هل تريد عكس هذا القيد؟')) {
                                reverseMutation.mutate(entry.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-orange-600 rounded"
                            title="عكس"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                قيد رقم: {selectedEntry.entryNumber}
              </h3>
              <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">التاريخ: </span>
                  <span className="font-medium">{formatDate(selectedEntry.date)}</span>
                </div>
                <div>
                  <span className="text-gray-500">الحالة: </span>
                  {statusBadge(selectedEntry.status)}
                </div>
                <div>
                  <span className="text-gray-500">البيان: </span>
                  <span className="font-medium">{selectedEntry.description}</span>
                </div>
              </div>

              <table className="w-full border rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header">كود الحساب</th>
                    <th className="table-header">اسم الحساب</th>
                    <th className="table-header">البيان</th>
                    <th className="table-header">مدين</th>
                    <th className="table-header">دائن</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntry.lines?.map((line: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="table-cell font-mono text-xs">{line.account?.code}</td>
                      <td className="table-cell">{line.account?.nameAr}</td>
                      <td className="table-cell text-gray-500">{line.description}</td>
                      <td className="table-cell">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                      <td className="table-cell">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-gray-50 font-bold">
                    <td colSpan={3} className="table-header">الإجمالي</td>
                    <td className="table-cell">{formatCurrency(selectedEntry.totalDebit)}</td>
                    <td className="table-cell">{formatCurrency(selectedEntry.totalCredit)}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="text-xs text-gray-400">
                بواسطة: {selectedEntry.createdBy?.nameAr || 'غير معروف'}
                {selectedEntry.postedBy && ` | تم الترحيل بواسطة: ${selectedEntry.postedBy.nameAr}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

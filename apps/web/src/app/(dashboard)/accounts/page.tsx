'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronLeft,
  FolderTree,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface Account {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  type: string;
  nature: string;
  level: number;
  isDetail: boolean;
  isActive: boolean;
  parentId?: string;
  children?: Account[];
}

interface AccountForm {
  code: string;
  nameAr: string;
  nameEn?: string;
  type: string;
  nature: string;
  parentId?: string;
  isDetail: boolean;
  allowManualEntry: boolean;
}

const accountTypes = [
  { value: 'ASSET', label: 'أصول' },
  { value: 'LIABILITY', label: 'خصوم' },
  { value: 'EQUITY', label: 'حقوق ملكية' },
  { value: 'REVENUE', label: 'إيرادات' },
  { value: 'EXPENSE', label: 'مصروفات' },
];

const natureOptions = [
  { value: 'DEBIT', label: 'مدين' },
  { value: 'CREDIT', label: 'دائن' },
];

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<AccountForm>({
    code: '',
    nameAr: '',
    nameEn: '',
    type: 'ASSET',
    nature: 'DEBIT',
    isDetail: true,
    allowManualEntry: true,
  });

  const { data: treeData, isLoading } = useQuery({
    queryKey: ['accounts-tree'],
    queryFn: () => apiClient.get('/accounts/tree').then((r: any) => r.data || r),
  });

  const createMutation = useMutation({
    mutationFn: (data: AccountForm) => apiClient.post('/accounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-tree'] });
      toast.success('تم إنشاء الحساب بنجاح');
      resetForm();
    },
    onError: (err: any) => toast.error(err?.message || 'فشل إنشاء الحساب'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccountForm> }) =>
      apiClient.put(`/accounts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-tree'] });
      toast.success('تم تحديث الحساب بنجاح');
      resetForm();
    },
    onError: (err: any) => toast.error(err?.message || 'فشل تحديث الحساب'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-tree'] });
      toast.success('تم تعطيل الحساب بنجاح');
    },
    onError: (err: any) => toast.error(err?.message || 'فشل حذف الحساب'),
  });

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ code: '', nameAr: '', nameEn: '', type: 'ASSET', nature: 'DEBIT', isDetail: true, allowManualEntry: true });
  };

  const handleEdit = async (id: string) => {
    try {
      const res: any = await apiClient.get(`/accounts/${id}`);
      const account = res.data || res;
      setForm({
        code: account.code,
        nameAr: account.nameAr,
        nameEn: account.nameEn || '',
        type: account.type,
        nature: account.nature,
        parentId: account.parentId,
        isDetail: account.isDetail,
        allowManualEntry: account.allowManualEntry,
      });
      setEditingId(id);
      setShowForm(true);
    } catch {
      toast.error('فشل تحميل بيانات الحساب');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filterAccounts = (accounts: Account[]): Account[] => {
    if (!searchQuery) return accounts;
    return accounts.filter(
      (acc) =>
        acc.nameAr.includes(searchQuery) ||
        acc.code.includes(searchQuery) ||
        acc.nameEn?.includes(searchQuery),
    );
  };

  const renderAccountNode = (account: Account, depth = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedNodes.has(account.id);
    const filteredChildren = hasChildren ? filterAccounts(account.children!) : [];

    return (
      <div key={account.id}>
        <div
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors rounded-lg group"
          style={{ marginRight: depth * 24 }}
        >
          <button
            onClick={() => hasChildren && toggleNode(account.id)}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              !hasChildren ? 'invisible' : ''
            }`}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
          </button>

          <span className="font-mono text-sm text-gray-500 w-20">{account.code}</span>
          <span className="flex-1 text-sm font-medium text-gray-900">{account.nameAr}</span>

          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              account.isDetail
                ? 'bg-blue-50 text-blue-600'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {account.isDetail ? 'تفصيلي' : 'مجمع'}
          </span>

          <span className="text-xs text-gray-400 w-16">
            {accountTypes.find((t) => t.value === account.type)?.label}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleEdit(account.id)}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
                  deleteMutation.mutate(account.id);
                }
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {(searchQuery ? filteredChildren : account.children).map((child) =>
              renderAccountNode(child, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث في شجرة الحسابات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pr-10"
            />
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          حساب جديد
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'تعديل حساب' : 'إضافة حساب جديد'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">كود الحساب</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">اسم الحساب (عربي)</label>
              <input
                type="text"
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">اسم الحساب (إنجليزي)</label>
              <input
                type="text"
                value={form.nameEn || ''}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                className="input-field ltr"
              />
            </div>
            <div>
              <label className="label">نوع الحساب</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input-field"
              >
                {accountTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">طبيعة الحساب</label>
              <select
                value={form.nature}
                onChange={(e) => setForm({ ...form, nature: e.target.value })}
                className="input-field"
              >
                {natureOptions.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">تفصيلي</label>
              <select
                value={form.isDetail ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, isDetail: e.target.value === 'true' })}
                className="input-field"
              >
                <option value="true">نعم</option>
                <option value="false">لا</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
                {editingId ? 'حفظ التعديلات' : 'إضافة'}
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
          <FolderTree size={18} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">شجرة الحسابات</span>
        </div>

        <div className="p-2">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
          ) : treeData?.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              لا توجد حسابات بعد، قم بإضافة حساب جديد
            </div>
          ) : (
            (searchQuery ? filterAccounts(treeData || []) : treeData || []).map((account: Account) =>
              renderAccountNode(account),
            )
          )}
        </div>
      </div>
    </div>
  );
}

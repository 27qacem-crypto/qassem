'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: () => apiClient.get('/company').then((r: any) => r.data || r),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/company', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: (err: any) => toast.error(err?.message || 'فشل حفظ الإعدادات'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      nameAr: formData.get('nameAr'),
      nameEn: formData.get('nameEn'),
      address: formData.get('address'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      taxNumber: formData.get('taxNumber'),
      currency: formData.get('currency'),
    });
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-6">إعدادات الشركة</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">اسم الشركة (عربي)</label>
              <input
                name="nameAr"
                defaultValue={company?.nameAr || ''}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">اسم الشركة (إنجليزي)</label>
              <input
                name="nameEn"
                defaultValue={company?.nameEn || ''}
                className="input-field ltr"
              />
            </div>
            <div>
              <label className="label">العنوان</label>
              <input
                name="address"
                defaultValue={company?.address || ''}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <input
                name="phone"
                defaultValue={company?.phone || ''}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                name="email"
                type="email"
                defaultValue={company?.email || ''}
                className="input-field ltr"
              />
            </div>
            <div>
              <label className="label">الرقم الضريبي</label>
              <input
                name="taxNumber"
                defaultValue={company?.taxNumber || ''}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">العملة</label>
              <select name="currency" defaultValue={company?.currency || 'EGP'} className="input-field">
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save size={18} />
            حفظ الإعدادات
          </button>
        </form>
      </div>
    </div>
  );
}

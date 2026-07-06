'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import { Calculator } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nameAr: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/auth/register', form);
      router.push('/login');
    } catch (err: any) {
      setError(err?.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-4">
            <Calculator size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</h1>
          <p className="text-gray-500 mt-1">نظام المحاسبة المتكامل</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label">الاسم بالعربية</label>
              <input
                type="text"
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">رقم الهاتف</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">كلمة المرور</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                minLength={6}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
            </button>

            <p className="text-center text-sm text-gray-500">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="text-primary-600 hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

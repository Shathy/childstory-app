'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAccessToken, supabase } from '@/lib/supabase';
import { uploadChildPhoto } from '@/lib/uploadChildPhoto';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CreateStoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    childName: '',
    childGender: 'male' as 'male' | 'female',
    childAge: 5,
    appearance: { skinTone: '', hairType: '', hairColor: '', glasses: false, sourceImageUrl: null as string | null },
    setting: 'space',
    moralValue: 'honesty',
    language: 'ar' as 'ar' | 'en',
  });

  // Guard: without this, unauthenticated users land here silently and every
  // submit fails with a 401 that was previously never shown to them.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
        return;
      }
      setCheckingAuth(false);
    })();
  }, [router]);

  const handlePhotoSelect = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadChildPhoto(file);
      setForm((f) => ({ ...f, appearance: { ...f.appearance, sourceImageUrl: url } }));
      setPhotoPreview(URL.createObjectURL(file));
    } catch (err: any) {
      setError(`فشل رفع الصورة: ${err.message ?? err}`);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!API_URL) {
        throw new Error('NEXT_PUBLIC_API_URL غير مضبوط — تحقق من Environment Variables في Vercel');
      }

      const token = await getAccessToken();
      if (!token) {
        throw new Error('انتهت جلستك، الرجاء تسجيل الدخول مرة أخرى');
      }

      const res = await fetch(`${API_URL}/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`(${res.status}) ${body || res.statusText}`);
      }

      const story = await res.json();
      router.push(`/stories/${story.id}`);
    } catch (err: any) {
      setError(err.message ?? 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return <p className="p-8 text-center">جارٍ التحقق من الجلسة...</p>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">أنشئ قصة طفلك المخصصة</h1>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <input
        placeholder="اسم الطفل"
        value={form.childName}
        onChange={(e) => setForm({ ...form, childName: e.target.value })}
        className="border rounded px-4 py-2"
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">صورة الطفل (اختياري)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handlePhotoSelect(e.target.files?.[0] ?? null)}
        />
        {uploading && <span className="text-sm text-gray-500">جارٍ الرفع...</span>}
        {photoPreview && (
          <img src={photoPreview} alt="" className="w-24 h-24 object-cover rounded-full" />
        )}
      </div>

      <select
        value={form.childGender}
        onChange={(e) => setForm({ ...form, childGender: e.target.value as any })}
        className="border rounded px-4 py-2"
      >
        <option value="male">ذكر</option>
        <option value="female">أنثى</option>
      </select>

      <input
        type="number"
        min={3}
        max={10}
        value={form.childAge}
        onChange={(e) => setForm({ ...form, childAge: Number(e.target.value) })}
        className="border rounded px-4 py-2"
      />

      <select
        value={form.setting}
        onChange={(e) => setForm({ ...form, setting: e.target.value })}
        className="border rounded px-4 py-2"
      >
        <option value="space">الفضاء</option>
        <option value="forest">الغابة</option>
        <option value="ocean">المحيط</option>
      </select>

      <select
        value={form.moralValue}
        onChange={(e) => setForm({ ...form, moralValue: e.target.value })}
        className="border rounded px-4 py-2"
      >
        <option value="honesty">الصدق</option>
        <option value="sharing">المشاركة</option>
        <option value="courage">الشجاعة</option>
      </select>

      <select
        value={form.language}
        onChange={(e) => setForm({ ...form, language: e.target.value as any })}
        className="border rounded px-4 py-2"
      >
        <option value="ar">العربية</option>
        <option value="en">English</option>
      </select>

      <button
        onClick={submit}
        disabled={loading || !form.childName}
        className="bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {loading ? 'جارٍ توليد القصة...' : 'إنشاء القصة'}
      </button>
    </div>
  );
}

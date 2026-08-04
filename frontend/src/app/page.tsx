'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getAccessToken } from '@/lib/supabase';
import { uploadChildPhoto } from '@/lib/uploadChildPhoto';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CreateStoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const handlePhotoSelect = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadChildPhoto(file);
      setForm((f) => ({ ...f, appearance: { ...f.appearance, sourceImageUrl: url } }));
      setPhotoPreview(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const story = await res.json();
      router.push(`/stories/${story.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">أنشئ قصة طفلك المخصصة</h1>

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

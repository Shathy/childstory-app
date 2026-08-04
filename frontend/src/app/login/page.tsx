'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendMagicLink = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (!error) setSent(true);
  };

  if (sent) {
    return <p className="p-8 text-center">تحقّق من بريدك الإلكتروني، أرسلنا لك رابط دخول 📩</p>;
  }

  return (
    <div className="max-w-sm mx-auto mt-20 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-center">تسجيل الدخول</h1>
      <input
        type="email"
        placeholder="بريدك الإلكتروني"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-4 py-2"
      />
      <button
        onClick={sendMagicLink}
        disabled={loading || !email}
        className="bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {loading ? 'جارٍ الإرسال...' : 'إرسال رابط الدخول'}
      </button>
    </div>
  );
}

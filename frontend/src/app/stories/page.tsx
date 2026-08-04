'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ArchivePage() {
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/stories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStories(await res.json());
    })();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">أرشيف القصص</h1>
      <div className="grid gap-4">
        {stories.map((s) => (
          <Link
            key={s.id}
            href={`/stories/${s.id}`}
            className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50"
          >
            <span>{s.title ?? 'قصة بلا عنوان'}</span>
            <span className="text-sm text-gray-500">{s.status}</span>
          </Link>
        ))}
        {stories.length === 0 && <p className="text-gray-500">لا توجد قصص بعد.</p>}
      </div>
    </div>
  );
}

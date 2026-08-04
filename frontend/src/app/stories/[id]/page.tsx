'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function StoryViewerPage({ params }: { params: { id: string } }) {
  const [story, setStory] = useState<any>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/stories/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStory(await res.json());
    })();
  }, [params.id]);

  const downloadPdf = async () => {
    setExporting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/stories/${params.id}/export/pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const { pdfUrl } = await res.json();
      window.open(pdfUrl, '_blank');
    } finally {
      setExporting(false);
    }
  };

  if (!story) return <p className="p-8 text-center">جارٍ التحميل...</p>;

  const pages = story.story_pages ?? [];
  const current = pages[pageIndex];
  const rtl = story.language === 'ar';

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col items-center gap-6" dir={rtl ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold">{story.title}</h1>

      {current && (
        <div className="border rounded-xl shadow p-8 w-full min-h-[300px] flex flex-col items-center justify-center gap-4">
          {/* real illustration will render here once image generation is enabled */}
          <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
            رسمة الصفحة (قريباً)
          </div>
          <p className="text-lg text-center leading-relaxed">{current.text_content}</p>
        </div>
      )}

      <div className="flex gap-4 items-center">
        <button
          onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          disabled={pageIndex === 0}
          className="px-4 py-2 border rounded disabled:opacity-40"
        >
          السابق
        </button>
        <span>
          {pageIndex + 1} / {pages.length}
        </span>
        <button
          onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
          disabled={pageIndex === pages.length - 1}
          className="px-4 py-2 border rounded disabled:opacity-40"
        >
          التالي
        </button>
      </div>

      <button
        onClick={downloadPdf}
        disabled={exporting}
        className="bg-indigo-600 text-white rounded px-6 py-2 disabled:opacity-50"
      >
        {exporting ? 'جارٍ التجهيز...' : 'تحميل PDF'}
      </button>
    </div>
  );
}

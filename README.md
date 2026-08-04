# Childstory App — MVP Scaffold

## البنية
```
backend/   → NestJS API (Node.js)
frontend/  → Next.js
supabase/schema.sql → مخطط قاعدة البيانات + RLS
```

## المسار الوظيفي (MVP الحالي)
1. المستخدم يسجّل دخول عبر Magic Link (Supabase Auth).
2. يملأ نموذج المدخلات (`/`) → `POST /stories`.
3. `StoriesService` يستدعي `TEXT_GENERATOR` (حالياً Groq – مجاني) لتوليد 6-8 صفحات + عنوان.
4. الصفحات تُحفظ في `story_pages` بحالة `image_status = not_requested`.
5. `image-generator.interface.ts` جاهزة و`NoopImageProvider` مفعّلة كبديل مؤقت — بدون أي استدعاء مدفوع.
6. `/stories/[id]` يعرض Flipbook بسيط + زر تحميل PDF (`POST /stories/:id/export/pdf` عبر PDFKit → يُرفع لـ Supabase Storage).
7. `/stories` أرشيف بسيط لقصص المستخدم.

## خطوات التشغيل محلياً
```bash
# 1) قاعدة البيانات
# نفّذ محتوى supabase/schema.sql داخل SQL Editor في مشروع Supabase
# وأنشئ Storage bucket باسم: story-exports (public)

# 2) Backend
cd backend
cp .env.example .env   # عبّي القيم
npm install
npm run start:dev

# 3) Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## PDF عربي (تم الحل)
التصدير عبر **puppeteer-core + Chromium نظامي** (`export/story-html.template.ts` + `export.service.ts`):
- يبني الصفحة كـ HTML بـ `dir="rtl"` وخط Cairo (Google Fonts).
- Chromium headless يتكفّل تلقائياً بـ text shaping والـ bidi reordering للعربي — بدون أي معالجة يدوية.
- كل صفحة قصة = `page-break-after: always` بحجم A4.

### لماذا Chromium نظامي بدل @sparticuz/chromium؟
Render وKoyeb حاويات Docker دائمة (وليست Lambda serverless حقيقية)، فتثبيت Chromium عبر `apt` في الـ Dockerfile:
- أخف على `npm install` (بدون تحميل/فك binary مضغوط بحجم كبير عند التشغيل).
- أكثر ثباتاً على حاويات بذاكرة محدودة (Free tier ~512MB).
- `@sparticuz/chromium` مصمم خصيصاً لقيود Lambda (نظام ملفات read-only) — غير مطلوب هنا.

### إعدادات مضبوطة لحدود الـ Free Tier
في `renderPdf` بالـ `export.service.ts`:
- `--disable-dev-shm-usage`: `/dev/shm` صغير جداً بالحاويات، Chromium يستخدم `/tmp` بدلاً منه.
- `--single-process` و`--no-zygote`: يمنع تفرّع عمليات Chromium إضافية توفيراً للذاكرة.
- `--disable-gpu`: لا يوجد GPU أصلاً بهذه البيئات.
- `page.setViewport({900x1200})`: يحدّ استهلاك الذاكرة أثناء الـ rendering.

## النشر (Deployment)

**Backend (Render أو Koyeb)**
1. اختر "Deploy from Dockerfile" (موجود بـ `backend/Dockerfile`) — يثبّت Chromium + fonts-noto-core (خط عربي احتياطي).
2. `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` مضبوط تلقائياً داخل الـ image نفسه (`ENV` بالـ Dockerfile) — لا داعي لإضافته يدوياً كمتغيّر بيئة على المنصة.
3. أضف بقية متغيرات `.env.example` (Supabase, TEXT_AI_*) من لوحة تحكم المنصة.
4. الـ free tier عادة "ينام" بعد فترة خمول — أول طلب بعدها أبطأ (cold start)، هذا طبيعي.

**Frontend (Vercel)**
- نشر مباشر لمجلد `frontend/` (Next.js مدعوم native، بدون Docker).
- أضف `NEXT_PUBLIC_*` من `.env.example` في إعدادات المشروع بـ Vercel.
- عدّل `NEXT_PUBLIC_API_URL` لرابط الـ backend على Render/Koyeb بعد نشره.

## رفع صورة الطفل (تم الحل)
- رفع مباشر من الـ frontend لـ Supabase Storage (`lib/uploadChildPhoto.ts`) — بدون المرور على الـ backend.
- Bucket: `child-photos` (**private**)، المسار: `{user_id}/{timestamp}-{filename}`.
- RLS policies في `schema.sql` تسمح للمستخدم بالوصول لمجلده فقط.
- بما أنه bucket خاص، نولّد **signed URL** صالح 7 أيام ونحفظه في `appearance.sourceImageUrl`.
- متكامل الآن في نموذج الإنشاء (`app/page.tsx`) بحقل رفع صورة + معاينة.

## بواقي لسه محتاجة قرارك
- **مزوّد النص المجاني**: مبني على Groq (متوافق مع OpenAI API)، قابل للتبديل بسطر واحد في `ai.module.ts`.
- **توليد الصور نفسه**: البنية جاهزة (`ImageGeneratorProvider`) لكن غير مفعّلة — بانتظار ميزانية اشتراك.

## متطلبات تشغيل إضافية (Bucket)
أنشئ في Supabase Dashboard > Storage:
- `child-photos` → **Private**
- `story-exports` → **Public**

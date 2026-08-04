-- ============================================
-- Childstory App - Supabase Schema (MVP)
-- ============================================

-- ---------- users profile (extends Supabase auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- ---------- stories ----------
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,

  -- Child input data
  child_name text not null,
  child_gender text not null check (child_gender in ('male', 'female')),
  child_age int not null check (child_age between 3 and 10),

  -- Appearance
  appearance jsonb not null default '{}'::jsonb,
  -- example: { "skinTone": "medium", "hairType": "curly", "hairColor": "black", "glasses": true, "sourceImageUrl": null }

  -- Story settings
  setting text not null,          -- e.g. "space", "forest"
  moral_value text not null,      -- e.g. "honesty", "sharing"
  language text not null check (language in ('ar', 'en')),

  -- Generation status
  status text not null default 'pending'
    check (status in ('pending', 'generating_text', 'text_ready', 'generating_images', 'completed', 'failed')),

  title text,
  pdf_url text,
  cover_image_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- story pages ----------
create table if not exists public.story_pages (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  page_number int not null,
  text_content text not null,

  -- image generation is infrastructure-only for now (disabled by default)
  image_url text,
  image_status text not null default 'not_requested'
    check (image_status in ('not_requested', 'queued', 'generating', 'ready', 'failed')),
  image_prompt text,

  created_at timestamptz not null default now(),
  unique (story_id, page_number)
);

-- ---------- indexes ----------
create index if not exists idx_stories_user_id on public.stories(user_id);
create index if not exists idx_story_pages_story_id on public.story_pages(story_id);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.story_pages enable row level security;

create policy "profiles are self-accessible" on public.profiles
  for all using (auth.uid() = id);

create policy "users manage their own stories" on public.stories
  for all using (auth.uid() = user_id);

create policy "users manage pages of their own stories" on public.story_pages
  for all using (
    exists (select 1 from public.stories s where s.id = story_id and s.user_id = auth.uid())
  );

-- ============================================
-- Storage buckets
-- ============================================
-- Run once (or via Dashboard > Storage):
--   create bucket "child-photos"   -> public: false (signed access only, kids' photos are sensitive)
--   create bucket "story-exports"  -> public: true  (shareable PDF links)

-- child-photos: each user can only read/write inside their own folder: {user_id}/...
create policy "users upload their own child photos"
  on storage.objects for insert
  with check (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users read their own child photos"
  on storage.objects for select
  using (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete their own child photos"
  on storage.objects for delete
  using (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

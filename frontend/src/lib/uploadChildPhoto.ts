import { supabase } from './supabase';

/**
 * Uploads directly from the browser to Supabase Storage (no backend hop).
 * File path is namespaced by user id so the RLS policies in schema.sql apply:
 *   {user_id}/{timestamp}-{filename}
 * `child-photos` is a PRIVATE bucket, so we return a short-lived signed URL
 * instead of a public one.
 */
export async function uploadChildPhoto(file: File): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('يجب تسجيل الدخول أولاً لرفع الصورة');

  const path = `${userId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('child-photos')
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;

  // signed URL valid for 7 days — enough for the generation + review flow
  const { data: signed, error: signError } = await supabase.storage
    .from('child-photos')
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (signError || !signed) throw signError ?? new Error('تعذّر إنشاء رابط الصورة');

  return signed.signedUrl;
}

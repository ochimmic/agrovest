// Private file uploads (KYC documents, payment receipts). Files are stored under
// <user_id>/... so storage rules limit each person to their own files.
import { supabase } from "@/integrations/supabase/client";

export type Bucket = "kyc-documents" | "payment-receipts";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

export async function uploadPrivate(bucket: Bucket, file: File, label: string): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File is larger than 10MB");
  if (!ACCEPT.split(",").includes(file.type)) throw new Error("Use a PNG, JPG, WEBP or PDF file");
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Please sign in again");
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${data.user.id}/${label}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

/** Short-lived link to view a private file. */
export async function signedUrl(bucket: Bucket, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export async function openPrivate(bucket: Bucket, path: string) {
  const w = window.open("", "_blank");
  try {
    const url = await signedUrl(bucket, path);
    if (w) w.location.href = url; else window.location.href = url;
  } catch (e) {
    w?.close();
    throw e;
  }
}

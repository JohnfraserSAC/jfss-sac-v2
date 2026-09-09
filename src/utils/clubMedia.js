import { CLUB_LOGOS_BUCKET } from "../config/clubApplications";
import { supabase } from "../lib/supabase";
import { toSameOriginSupabaseUrl } from "./proxiedSupabaseUrl";

/**
 * club.logo_url may be a full URL or a club-logos storage path
 * (e.g. after reapplication approval).
 */
export async function resolveClubLogoUrl(logoUrl) {
  if (!logoUrl || typeof logoUrl !== "string") return null;

  const trimmed = logoUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    const proxied = toSameOriginSupabaseUrl(trimmed);
    return typeof proxied === "string" ? proxied : trimmed;
  }

  const { data, error } = await supabase.storage
    .from(CLUB_LOGOS_BUCKET)
    .createSignedUrl(trimmed, 60 * 60);

  return error ? null : toSameOriginSupabaseUrl(data?.signedUrl) || null;
}

export const SUPABASE_PROJECT_REF = "nvpxsuafdcrobnackhnd";
export const SUPABASE_AUTH_STORAGE_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
export const SUPABASE_PROXY_PATH = "/supabase";

export function getBrowserSupabaseUrl(origin) {
  const resolvedOrigin =
    origin ??
    (typeof globalThis !== "undefined" ? globalThis.location?.origin : "");

  if (!resolvedOrigin) {
    throw new Error(
      "Missing browser origin for the same-origin Supabase proxy URL.",
    );
  }

  return new URL(SUPABASE_PROXY_PATH, resolvedOrigin).href.replace(/\/$/, "");
}

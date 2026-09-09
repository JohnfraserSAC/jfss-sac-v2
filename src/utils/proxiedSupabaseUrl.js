import { SUPABASE_PROJECT_REF, SUPABASE_PROXY_PATH } from "../lib/supabaseConfig";

function isAuthoritativeSupabaseHost(hostname) {
  const parts = String(hostname || "")
    .trim()
    .toLowerCase()
    .split(".");

  return (
    parts.length === 3 &&
    parts[0] === SUPABASE_PROJECT_REF &&
    parts[1] === "supabase" &&
    parts[2] === "co"
  );
}

/**
 * Rewrite legacy absolute URLs for this project's Storage/Auth/REST host
 * onto the current origin's /supabase proxy. Leaves every other value alone.
 */
export function toSameOriginSupabaseUrl(value, origin) {
  if (value == null || typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return value;
  }

  if (!isAuthoritativeSupabaseHost(parsed.hostname)) {
    return value;
  }

  const resolvedOrigin =
    origin ??
    (typeof globalThis !== "undefined" ? globalThis.location?.origin : "");

  if (!resolvedOrigin) {
    return value;
  }

  const proxied = new URL(resolvedOrigin);
  proxied.pathname = `${SUPABASE_PROXY_PATH}${parsed.pathname}`;
  proxied.search = parsed.search;
  proxied.hash = parsed.hash;
  return proxied.toString();
}

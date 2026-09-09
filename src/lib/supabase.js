import { createClient } from "@supabase/supabase-js";
import {
  getBrowserSupabaseUrl,
  SUPABASE_AUTH_STORAGE_KEY,
} from "./supabaseConfig";

const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// Proxying adds a hop, and allowed uploads can be up to 10 MB.
const SUPABASE_REQUEST_TIMEOUT_MS = 60000;

if (!supabasePublishableKey) {
  throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY");
}

function isOpaqueSupabaseApiKey(value) {
  return (
    typeof value === "string" &&
    (value.startsWith("sb_publishable_") || value.startsWith("sb_secret_"))
  );
}

function fetchWithTimeout(input, init = {}) {
  const timeoutController = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => timeoutController.abort(),
    SUPABASE_REQUEST_TIMEOUT_MS,
  );
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutController.signal])
    : timeoutController.signal;

  const headers = new Headers(init.headers ?? {});
  const authorization = headers.get("Authorization");
  if (authorization) {
    const token = authorization.replace(/^Bearer\s+/i, "");
    // Publishable keys are not JWTs. Keep them on apikey only.
    if (isOpaqueSupabaseApiKey(token)) {
      headers.delete("Authorization");
    }
  }

  return fetch(input, { ...init, headers, signal }).finally(() => {
    globalThis.clearTimeout(timeoutId);
  });
}

export const supabase = createClient(
  getBrowserSupabaseUrl(),
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: SUPABASE_AUTH_STORAGE_KEY,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  },
);

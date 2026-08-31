import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_REQUEST_TIMEOUT_MS = 15000;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
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

  return fetch(input, { ...init, signal }).finally(() => {
    globalThis.clearTimeout(timeoutId);
  });
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  global: {
    fetch: fetchWithTimeout,
  },
});

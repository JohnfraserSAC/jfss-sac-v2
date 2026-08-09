const AUTH_RETURN_TO_KEY = "jfss_sac_auth_return_to";

function normalizeReturnPath(path) {
  const value = String(path || "").trim();
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value === "/login" || value.startsWith("/login/")) return null;
  return value;
}

export function rememberAuthReturnTo(path) {
  const normalized = normalizeReturnPath(path);
  if (!normalized) return;
  try {
    sessionStorage.setItem(AUTH_RETURN_TO_KEY, normalized);
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

export function peekAuthReturnTo() {
  try {
    return sessionStorage.getItem(AUTH_RETURN_TO_KEY);
  } catch {
    return null;
  }
}

export function consumeAuthReturnTo(fallback = null) {
  try {
    const value = sessionStorage.getItem(AUTH_RETURN_TO_KEY);
    sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    return value || fallback;
  } catch {
    return fallback;
  }
}

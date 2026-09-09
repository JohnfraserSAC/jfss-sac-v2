import { SUPABASE_PROJECT_REF } from "./supabaseConfig.js";

export const AUTH_SESSION_BROWSER_PATH = "/api/sf/go";

export const SUPABASE_UPSTREAM_ORIGIN = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

/** Short codes so the browser URL does not contain grant_type=refresh_token. */
export const GRANT_TYPE_CODES = {
  id_token: "1",
  refresh_token: "2",
  password: "3",
  pkce: "4",
  web3: "5",
  sso: "6",
};

export const GRANT_CODE_TYPES = Object.fromEntries(
  Object.entries(GRANT_TYPE_CODES).map(([grantType, code]) => [code, grantType]),
);

function parseUrl(input, origin) {
  try {
    return new URL(input, origin);
  } catch {
    return null;
  }
}

export function isAuthTokenPath(pathname) {
  return String(pathname || "").endsWith("/auth/v1/token");
}

/**
 * Map GoTrue `/auth/v1/token?grant_type=…` onto `/api/sf/go?g=…` so school
 * content filters that block `token` / `refresh_token` never see those strings.
 */
export function rewriteBrowserAuthTokenUrl(input, origin) {
  const url = parseUrl(input, origin);
  if (!url || !isAuthTokenPath(url.pathname)) {
    return input;
  }

  const grantType = url.searchParams.get("grant_type");
  const proxied = new URL(AUTH_SESSION_BROWSER_PATH, url.origin);
  const code = grantType ? GRANT_TYPE_CODES[grantType] : undefined;

  if (code) {
    proxied.searchParams.set("g", code);
  } else if (grantType) {
    proxied.searchParams.set("g", grantType);
  }

  url.searchParams.forEach((value, key) => {
    if (key !== "grant_type" && key !== "g") {
      proxied.searchParams.set(key, value);
    }
  });

  return proxied.toString();
}

export function resolveGrantType(searchParams) {
  const code = searchParams.get("g");
  if (code && GRANT_CODE_TYPES[code]) {
    return GRANT_CODE_TYPES[code];
  }
  return searchParams.get("grant_type");
}

/**
 * Map `/api/sf/go?g=…` back to the real GoTrue token URL on this project.
 */
export function toUpstreamAuthTokenUrl(incomingUrl, upstreamOrigin = SUPABASE_UPSTREAM_ORIGIN) {
  const incoming = parseUrl(incomingUrl, upstreamOrigin);
  if (!incoming) {
    throw new Error("Invalid auth proxy URL.");
  }

  const dest = new URL("/auth/v1/token", upstreamOrigin);
  const grantType = resolveGrantType(incoming.searchParams);
  if (grantType) {
    dest.searchParams.set("grant_type", grantType);
  }

  incoming.searchParams.forEach((value, key) => {
    if (key !== "g" && key !== "grant_type") {
      dest.searchParams.set(key, value);
    }
  });

  return dest.toString();
}

export function toUpstreamAuthTokenPath(pathAndQuery) {
  const url = toUpstreamAuthTokenUrl(
    `https://proxy.local${pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`}`,
  );
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

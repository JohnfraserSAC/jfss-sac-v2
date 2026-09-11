import { SUPABASE_PROXY_PATH } from "./supabaseConfig.js";
import {
  rewriteBrowserAuthTokenUrl,
  SUPABASE_UPSTREAM_ORIGIN,
} from "./supabaseAuthProxy.js";

const SERVICE_TO_ALIAS = {
  rest: "q",
  auth: "a",
  storage: "f",
  functions: "fn",
};

const ALIAS_TO_SERVICE = Object.fromEntries(
  Object.entries(SERVICE_TO_ALIAS).map(([service, alias]) => [alias, service]),
);

function parseUrl(input, origin) {
  try {
    return new URL(input, origin);
  } catch {
    return null;
  }
}

function replaceFirstSegment(pathname, from, to) {
  const prefix = `${SUPABASE_PROXY_PATH}/${from}`;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    return `${SUPABASE_PROXY_PATH}/${to}${pathname.slice(prefix.length)}`;
  }
  return pathname;
}

export function rewriteBrowserServiceAliases(input, origin) {
  const url = parseUrl(input, origin);
  if (!url) return input;

  let pathname = url.pathname;
  for (const [service, alias] of Object.entries(SERVICE_TO_ALIAS)) {
    pathname = replaceFirstSegment(pathname, service, alias);
  }
  if (pathname === url.pathname) return input;
  url.pathname = pathname;
  return url.toString();
}

export function rewriteBrowserGatewayUrl(input, origin) {
  return rewriteBrowserServiceAliases(
    rewriteBrowserAuthTokenUrl(input, origin),
    origin,
  );
}

export function toUpstreamGatewayUrl(
  incomingUrl,
  upstreamOrigin = SUPABASE_UPSTREAM_ORIGIN,
) {
  const incoming = parseUrl(incomingUrl, upstreamOrigin);
  if (!incoming) {
    throw new Error("Invalid API proxy URL.");
  }

  let pathname = incoming.pathname;
  if (pathname === SUPABASE_PROXY_PATH) {
    pathname = "/";
  } else if (pathname.startsWith(`${SUPABASE_PROXY_PATH}/`)) {
    pathname = pathname.slice(SUPABASE_PROXY_PATH.length);
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && ALIAS_TO_SERVICE[segments[0]]) {
    segments[0] = ALIAS_TO_SERVICE[segments[0]];
  }

  const dest = new URL(upstreamOrigin);
  dest.pathname = `/${segments.join("/")}`;
  dest.search = incoming.search;
  dest.hash = incoming.hash;
  return dest.toString();
}

export function toBrowserProxyPath(upstreamPathname) {
  const raw = String(upstreamPathname || "");
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const segments = path.split("/").filter(Boolean);
  if (segments[0] && SERVICE_TO_ALIAS[segments[0]]) {
    segments[0] = SERVICE_TO_ALIAS[segments[0]];
  }
  return `${SUPABASE_PROXY_PATH}/${segments.join("/")}`;
}

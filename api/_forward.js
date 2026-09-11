export const config = { runtime: "edge" };

const REQUEST_HEADER_ALLOWLIST = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "prefer",
  "x-supabase-api-version",
];

function getServerPublishableKey() {
  const env = globalThis.process?.env ?? {};
  return env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
}

function shouldDropResponseHeader(name, value) {
  const header = name.toLowerCase();
  if (
    header.startsWith("sb-") ||
    header.startsWith("cf-") ||
    header.startsWith("x-supabase") ||
    header.startsWith("x-envoy")
  ) {
    return true;
  }
  if (
    header === "server" ||
    header === "alt-svc" ||
    header.startsWith("access-control-")
  ) {
    return true;
  }
  if (header === "set-cookie" && /supabase\.co/i.test(String(value || ""))) {
    return true;
  }
  return false;
}

export function sanitizeUpstreamResponse(upstream) {
  const headers = new Headers();
  upstream.headers.forEach((value, name) => {
    if (shouldDropResponseHeader(name, value)) return;
    headers.append(name, value);
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export function buildUpstreamHeaders(request) {
  const headers = new Headers();
  for (const name of REQUEST_HEADER_ALLOWLIST) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const authorization = headers.get("Authorization");
  if (authorization) {
    const token = authorization.replace(/^Bearer\s+/i, "");
    if (
      token === "public" ||
      token.startsWith("sb_publishable_") ||
      token.startsWith("sb_secret_")
    ) {
      headers.delete("Authorization");
    }
  }

  const apiKey = getServerPublishableKey();
  if (apiKey) {
    headers.set("apikey", apiKey);
    if (!headers.has("x-supabase-api-version")) {
      headers.set("x-supabase-api-version", "2024-01-01");
    }
  }

  return headers;
}

export async function proxySupabaseRequest(request, destUrl) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const headers = buildUpstreamHeaders(request);
  if (!headers.get("apikey")) {
    return new Response(JSON.stringify({ message: "Service unavailable." }), {
      status: 503,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  const upstream = await fetch(destUrl, init);
  return sanitizeUpstreamResponse(upstream);
}

export default function helperNotFound() {
  return new Response(null, { status: 404 });
}

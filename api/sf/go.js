import { toUpstreamAuthTokenUrl } from "../../src/lib/supabaseAuthProxy.js";

export const config = { runtime: "edge" };

const FORWARD_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "apikey",
  "authorization",
  "content-type",
  "prefer",
  "x-client-info",
  "x-supabase-api-version",
];

function pickHeaders(source, names) {
  const headers = new Headers();
  for (const name of names) {
    const value = source.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const dest = toUpstreamAuthTokenUrl(request.url);
  const headers = pickHeaders(request.headers, FORWARD_REQUEST_HEADERS);
  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  return fetch(dest, init);
}

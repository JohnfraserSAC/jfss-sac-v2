import { toUpstreamAuthTokenUrl } from "./_paths.js";
import { proxySupabaseRequest } from "./_forward.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  return proxySupabaseRequest(request, toUpstreamAuthTokenUrl(request.url));
}

import {
  resolveIncomingGatewayUrl,
  toUpstreamGatewayUrl,
} from "../../src/lib/supabaseGateway.js";
import { proxySupabaseRequest } from "../../src/lib/supabaseGatewayServer.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  return proxySupabaseRequest(
    request,
    toUpstreamGatewayUrl(resolveIncomingGatewayUrl(request.url)),
  );
}

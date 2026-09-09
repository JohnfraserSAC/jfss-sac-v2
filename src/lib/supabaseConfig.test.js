import { describe, expect, it } from "vitest";
import {
  getBrowserSupabaseUrl,
  SUPABASE_AUTH_STORAGE_KEY,
  SUPABASE_PROXY_PATH,
} from "./supabaseConfig.js";

describe("same-origin Supabase client configuration", () => {
  it("builds the browser base URL from the current origin plus /supabase", () => {
    expect(getBrowserSupabaseUrl("https://www.johnfrasersac.com")).toBe(
      "https://www.johnfrasersac.com/supabase",
    );
    expect(getBrowserSupabaseUrl("https://preview-deployment.vercel.app")).toBe(
      "https://preview-deployment.vercel.app/supabase",
    );
    expect(getBrowserSupabaseUrl("http://localhost:5173")).toBe(
      "http://localhost:5173/supabase",
    );
    expect(SUPABASE_PROXY_PATH).toBe("/supabase");
  });

  it("uses an explicit Auth storage key for this Supabase project", () => {
    expect(SUPABASE_AUTH_STORAGE_KEY).toBe(
      "sb-nvpxsuafdcrobnackhnd-auth-token",
    );
  });
});

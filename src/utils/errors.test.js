import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./errors.js";

describe("getErrorMessage", () => {
  it("explains 502 and empty {} auth errors instead of showing raw JSON", () => {
    expect(getErrorMessage({ message: "{}", status: 502 })).toMatch(
      /school Wi-Fi/i,
    );
    expect(getErrorMessage({ message: "{}", status: 0 })).toMatch(/school Wi-Fi/i);
    expect(getErrorMessage({ message: "Bad Gateway", status: 502 })).toMatch(
      /school Wi-Fi/i,
    );
  });

  it("keeps existing business-rule messages", () => {
    expect(getErrorMessage("duplicate key value violates unique constraint")).toMatch(
      /already in use/i,
    );
  });

  it("asks signed-out users to sign in instead of showing a permission warning", () => {
    expect(getErrorMessage("permission denied for table profiles")).toBe(
      "Sign in to see this.",
    );
    expect(
      getErrorMessage({ message: "new row violates row-level security", code: "42501" }),
    ).toBe("Sign in to see this.");
  });

  it("hides Vercel NOT_FOUND page text", () => {
    expect(
      getErrorMessage({
        message: "The page could not be found NOT_FOUND iad1::abc",
        status: 404,
      }),
    ).toMatch(/reach the API/i);
  });
});

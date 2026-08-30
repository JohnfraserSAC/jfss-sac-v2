import { describe, expect, it } from "vitest";
import { validateClubPromoLunchForm } from "./clubPromoLunch";

describe("validateClubPromoLunchForm", () => {
  it("accepts a complete sign-up", () => {
    const result = validateClubPromoLunchForm({
      boothDays: "BOTH",
      approvalEmailReceived: true,
      representatives: "Jason Chou - jason@example.com",
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("requires all sign-up details", () => {
    const result = validateClubPromoLunchForm({
      boothDays: "",
      approvalEmailReceived: null,
      representatives: "",
    });

    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(3);
  });
});

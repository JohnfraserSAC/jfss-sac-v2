import { describe, expect, it } from "vitest";
import { validateOwnerNames } from "./validation.js";

describe("validateOwnerNames", () => {
  it("requires names on applications", () => {
    expect(validateOwnerNames("")).toBe("List the full name of every club owner.");
    expect(validateOwnerNames("Ada Lovelace")).toBeNull();
  });

  it("allows empty names when optional", () => {
    expect(validateOwnerNames("", { required: false })).toBeNull();
  });
});

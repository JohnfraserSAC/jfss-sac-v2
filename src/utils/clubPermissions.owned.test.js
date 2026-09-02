import { describe, expect, it } from "vitest";
import {
  canSubmitClubRequestForms,
  getOwnedApprovedClubs,
} from "./clubPermissions.js";

describe("getOwnedApprovedClubs", () => {
  it("returns approved clubs the user actively owns", () => {
    const clubs = getOwnedApprovedClubs([
      {
        status: "ACTIVE",
        role: "OWNER",
        clubs: { id: "1", name: "Chess", status: "APPROVED", deleted_at: null },
      },
      {
        status: "ACTIVE",
        role: "EXEC",
        clubs: { id: "2", name: "Drama", status: "APPROVED", deleted_at: null },
      },
      {
        status: "ACTIVE",
        role: "OWNER",
        clubs: { id: "3", name: "Old", status: "ARCHIVED", deleted_at: null },
      },
    ]);

    expect(clubs).toEqual([
      { id: "1", name: "Chess", status: "APPROVED", deleted_at: null },
    ]);
  });
});

describe("canSubmitClubRequestForms", () => {
  it("allows active owners of ACTIVE or pending-supervisor clubs", () => {
    expect(
      canSubmitClubRequestForms({
        clubRole: "OWNER",
        membershipStatus: "ACTIVE",
        annualStatus: "ACTIVE",
      }),
    ).toBe(true);
    expect(
      canSubmitClubRequestForms({
        clubRole: "OWNER",
        membershipStatus: "ACTIVE",
        annualStatus: "PENDING_SUPERVISOR",
      }),
    ).toBe(true);
    expect(
      canSubmitClubRequestForms({
        clubRole: "OWNER",
        membershipStatus: "ACTIVE",
      }),
    ).toBe(true);
  });

  it("blocks executives and inactive annual clubs", () => {
    expect(
      canSubmitClubRequestForms({
        clubRole: "EXEC",
        membershipStatus: "ACTIVE",
        annualStatus: "ACTIVE",
      }),
    ).toBe(false);
    expect(
      canSubmitClubRequestForms({
        clubRole: "OWNER",
        membershipStatus: "ACTIVE",
        annualStatus: "INACTIVE",
      }),
    ).toBe(false);
  });
});

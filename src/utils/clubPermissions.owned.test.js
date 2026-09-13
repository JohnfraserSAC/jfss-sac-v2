import { describe, expect, it } from "vitest";
import {
  canArchiveOwnedClub,
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

describe("canArchiveOwnedClub", () => {
  it("allows active owners of ACTIVE or pending-supervisor clubs", () => {
    expect(
      canArchiveOwnedClub({
        clubRole: "OWNER",
        membershipStatus: "ACTIVE",
        annualStatus: "ACTIVE",
      }),
    ).toBe(true);
    expect(
      canArchiveOwnedClub({
        clubRole: "OWNER",
        membershipStatus: "ACTIVE",
        annualStatus: "PENDING_SUPERVISOR",
      }),
    ).toBe(true);
  });

  it("blocks executives, inactive memberships, and inactive annual clubs", () => {
    expect(
      canArchiveOwnedClub({
        clubRole: "EXEC",
        membershipStatus: "ACTIVE",
        annualStatus: "ACTIVE",
      }),
    ).toBe(false);
    expect(
      canArchiveOwnedClub({
        clubRole: "OWNER",
        membershipStatus: "INACTIVE",
        annualStatus: "ACTIVE",
      }),
    ).toBe(false);
    expect(
      canArchiveOwnedClub({
        clubRole: "OWNER",
        membershipStatus: "ACTIVE",
        annualStatus: "INACTIVE",
      }),
    ).toBe(false);
  });

  it("allows site admins to archive any club they do not own", () => {
    expect(
      canArchiveOwnedClub({
        isSacAdmin: true,
        annualStatus: "ACTIVE",
      }),
    ).toBe(true);
    expect(
      canArchiveOwnedClub({
        isSacAdmin: true,
        clubRole: "MEMBER",
        membershipStatus: "ACTIVE",
        annualStatus: "PENDING_SUPERVISOR",
      }),
    ).toBe(true);
    expect(
      canArchiveOwnedClub({
        isSacAdmin: true,
        annualStatus: "INACTIVE",
      }),
    ).toBe(true);
    expect(
      canArchiveOwnedClub({
        isSacAdmin: true,
        annualStatus: "SUSPENDED",
      }),
    ).toBe(true);
    expect(
      canArchiveOwnedClub({
        isSacAdmin: true,
      }),
    ).toBe(true);
    expect(
      canArchiveOwnedClub({
        isSacAdmin: true,
        clubStatus: "ARCHIVED",
        annualStatus: "INACTIVE",
      }),
    ).toBe(false);
  });
});

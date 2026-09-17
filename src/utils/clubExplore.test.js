import { describe, expect, it } from "vitest";
import {
  CLUB_EXPLORE_DESKTOP_PAGE_SIZE,
  CLUB_EXPLORE_MOBILE_PAGE_SIZE,
  getClubExplorePageSize,
} from "./clubExplore.js";

describe("getClubExplorePageSize", () => {
  it("loads nine clubs on desktop and six on mobile", () => {
    expect(getClubExplorePageSize(false)).toBe(CLUB_EXPLORE_DESKTOP_PAGE_SIZE);
    expect(getClubExplorePageSize(true)).toBe(CLUB_EXPLORE_MOBILE_PAGE_SIZE);
    expect(CLUB_EXPLORE_DESKTOP_PAGE_SIZE).toBe(9);
    expect(CLUB_EXPLORE_MOBILE_PAGE_SIZE).toBe(6);
  });
});

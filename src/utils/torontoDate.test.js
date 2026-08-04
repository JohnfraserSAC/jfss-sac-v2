import { describe, expect, it } from "vitest";
import {
  addCalendarDaysYmd,
  diffCalendarDaysYmd,
  getPostingUrgency,
  getTorontoTodayYmd,
  getTorontoTomorrowYmd,
  isValidFutureTorontoPostingDate,
} from "./torontoDate";

describe("torontoDate", () => {
  it("adds calendar days across month boundaries", () => {
    expect(addCalendarDaysYmd("2026-01-31", 1)).toBe("2026-02-01");
    expect(addCalendarDaysYmd("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("diffs calendar days", () => {
    expect(diffCalendarDaysYmd("2026-08-04", "2026-08-05")).toBe(1);
    expect(diffCalendarDaysYmd("2026-08-04", "2026-08-08")).toBe(4);
  });

  it("computes urgency labels from remaining days", () => {
    const today = getTorontoTodayYmd();
    expect(getPostingUrgency(addCalendarDaysYmd(today, 1)).label).toBe(
      "Posts tomorrow",
    );
    expect(getPostingUrgency(addCalendarDaysYmd(today, 2)).tone).toBe(
      "warning",
    );
    expect(getPostingUrgency(addCalendarDaysYmd(today, 3)).label).toBe(
      "Posts in 3 days",
    );
    expect(getPostingUrgency(addCalendarDaysYmd(today, 5)).tone).toBe(
      "success",
    );
  });

  it("rejects today and past posting dates", () => {
    const today = getTorontoTodayYmd();
    expect(isValidFutureTorontoPostingDate(today)).toBe(false);
    expect(
      isValidFutureTorontoPostingDate(addCalendarDaysYmd(today, -1)),
    ).toBe(false);
    expect(isValidFutureTorontoPostingDate(getTorontoTomorrowYmd())).toBe(
      true,
    );
  });
});

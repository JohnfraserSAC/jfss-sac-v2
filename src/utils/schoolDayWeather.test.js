import { describe, expect, it } from "vitest";
import {
  weatherConditionLabel,
  weatherIconKey,
} from "../services/weather";
import { canMutateSchoolDay } from "./execPermissions";

describe("school day permissions", () => {
  it("allows SAC_ADMIN and SAC_EXEC only", () => {
    expect(canMutateSchoolDay([{ code: "SAC_ADMIN" }])).toBe(true);
    expect(canMutateSchoolDay([{ code: "SAC_EXEC" }])).toBe(true);
    expect(canMutateSchoolDay([{ code: "FACULTY_ADVISOR" }])).toBe(false);
    expect(canMutateSchoolDay([])).toBe(false);
  });
});

describe("weather mapping", () => {
  it("maps WMO codes to labels and icon keys", () => {
    expect(weatherConditionLabel(0)).toBe("Clear sky");
    expect(weatherIconKey(0)).toBe("clear");
    expect(weatherIconKey(61)).toBe("rain");
    expect(weatherIconKey(75)).toBe("snow");
    expect(weatherIconKey(95)).toBe("storm");
  });
});

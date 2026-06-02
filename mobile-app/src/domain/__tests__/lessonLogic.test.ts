import {
  computeDurationMin,
  lessonsConflict,
  unitsFromDuration,
} from "@/src/domain/lessonLogic";

describe("lessonLogic", () => {
  it("computes duration with breaks between lesson units", () => {
    expect(computeDurationMin(1)).toBe(45);
    expect(computeDurationMin(2)).toBe(105);
    expect(computeDurationMin(3)).toBe(165);
  });

  it("normalizes invalid units to one lesson unit", () => {
    expect(computeDurationMin(0)).toBe(45);
    expect(computeDurationMin(1.8)).toBe(45);
  });

  it("returns units from duration", () => {
    expect(unitsFromDuration(45)).toBe(1);
    expect(unitsFromDuration(105)).toBe(2);
  });

  it("detects overlapping lessons and too short breaks", () => {
    const first = { date: "2026-06-01T10:00:00.000Z", durationMin: 45 };
    expect(
      lessonsConflict(first, {
        date: "2026-06-01T10:30:00.000Z",
        durationMin: 45,
      })
    ).toBe(true);
    expect(
      lessonsConflict(first, {
        date: "2026-06-01T10:50:00.000Z",
        durationMin: 45,
      })
    ).toBe(true);
    expect(
      lessonsConflict(first, {
        date: "2026-06-01T11:00:00.000Z",
        durationMin: 45,
      })
    ).toBe(false);
  });
});

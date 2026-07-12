import { describe, expect, it } from "vitest"
import {
  averageEnrollmentProgress,
  clampProgressPercent,
  courseProgressFromDisciplineStatuses,
  progressLookupKey,
} from "@/lib/studentCourseProgress"

describe("clampProgressPercent", () => {
  it("clamps and rounds", () => {
    expect(clampProgressPercent(-1)).toBe(0)
    expect(clampProgressPercent(101)).toBe(100)
    expect(clampProgressPercent(49.5)).toBe(50)
  })

  it("returns 0 for non-finite values", () => {
    expect(clampProgressPercent(Number.NaN)).toBe(0)
  })
})

describe("courseProgressFromDisciplineStatuses", () => {
  const statuses: Record<string, string> = {
    d1: "approved",
    d2: "in_progress",
    d3: "pending",
    d4: "approved",
  }

  it("returns 0 when there are no disciplines", () => {
    expect(courseProgressFromDisciplineStatuses([], () => "approved")).toBe(0)
  })

  it("counts approved over all disciplines when no linked filter", () => {
    expect(
      courseProgressFromDisciplineStatuses(["d1", "d2", "d3", "d4"], (id) => statuses[id] ?? "pending"),
    ).toBe(50)
  })

  it("prefers linked discipline set when provided", () => {
    const linked = new Set(["d1", "d2"])
    expect(
      courseProgressFromDisciplineStatuses(
        ["d1", "d2", "d3", "d4"],
        (id) => statuses[id] ?? "pending",
        linked,
      ),
    ).toBe(50)
  })

  it("uses full list when linked set is empty", () => {
    expect(
      courseProgressFromDisciplineStatuses(
        ["d1", "d2"],
        (id) => statuses[id] ?? "pending",
        new Set(),
      ),
    ).toBe(50)
  })
})

describe("averageEnrollmentProgress", () => {
  it("returns 0 for empty enrollments", () => {
    expect(averageEnrollmentProgress([])).toBe(0)
  })

  it("averages enrollment percents", () => {
    expect(averageEnrollmentProgress([0, 100])).toBe(50)
    expect(averageEnrollmentProgress([25, 75])).toBe(50)
  })
})

describe("progressLookupKey", () => {
  it("joins student and discipline ids", () => {
    expect(progressLookupKey("stu-1", "disc-9")).toBe("stu-1:disc-9")
  })
})

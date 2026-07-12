import { describe, expect, it } from "vitest"
import { normalizeTeamRole } from "@/consts/teamRoles"

describe("normalizeTeamRole", () => {
  it("keeps canonical delivery roles", () => {
    expect(normalizeTeamRole("admin")).toBe("admin")
    expect(normalizeTeamRole("coordinator")).toBe("coordinator")
    expect(normalizeTeamRole("professor")).toBe("professor")
  })

  it("maps legacy roles to delivery roles", () => {
    expect(normalizeTeamRole("secretary")).toBe("coordinator")
    expect(normalizeTeamRole("financial")).toBe("admin")
    expect(normalizeTeamRole("tutor")).toBe("professor")
    expect(normalizeTeamRole("commercial")).toBe("professor")
  })

  it("defaults unknown values to professor", () => {
    expect(normalizeTeamRole(null)).toBe("professor")
    expect(normalizeTeamRole(undefined)).toBe("professor")
    expect(normalizeTeamRole("")).toBe("professor")
    expect(normalizeTeamRole("something-else")).toBe("professor")
  })
})

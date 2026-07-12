import type { GamificationLevel, XPAction } from "@/types/gamification"

export function getCategoryColor(category: XPAction["category"]) {
  switch (category) {
    case "lesson":
      return "bg-primary/10 text-primary"
    case "quiz":
      return "bg-success/10 text-success"
    case "engagement":
      return "bg-info/10 text-info"
    case "social":
      return "bg-warning/10 text-warning"
    default:
      return "bg-muted"
  }
}

export function badgeSlugFromName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "") || `badge_${Date.now()}`
  )
}

export function levelProgressValue(levels: GamificationLevel[], index: number) {
  const level = levels[index]
  if (!level) return 0
  if (index < levels.length - 1) {
    return (
      ((level.xpRequired - (levels[index - 1]?.xpRequired || 0)) /
        (levels[levels.length - 1].xpRequired || 1)) *
      100
    )
  }
  return 100
}

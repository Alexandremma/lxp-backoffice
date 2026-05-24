import { generateConditionText } from "@/lib/badge-rules"
import type {
  BadgeRuleConfig,
  BadgeTriggerType,
  GamificationBadge,
  GamificationLevel,
  XPAction,
} from "@/types/gamification"
import { XP_ACTION_CATALOG } from "@/lib/gamificationXpCatalog"
import type { BadgeRow, LevelRow, XpRuleRow } from "@/services/gamificationAdminService"

export function xpRulesToUiActions(rules: XpRuleRow[]): XPAction[] {
  const byKey = new Map(rules.map((r) => [r.action_key, r]))
  return XP_ACTION_CATALOG.map((catalog) => {
    const row = byKey.get(catalog.action_key)
    return {
      id: catalog.action_key,
      name: row?.label ?? catalog.name,
      description: catalog.description,
      xpValue: row?.xp_value ?? 0,
      category: (row?.category ?? catalog.category) as XPAction["category"],
      enabled: row?.is_active ?? false,
    }
  })
}

export function levelRowToUi(row: LevelRow): GamificationLevel {
  return {
    level: row.level_number,
    name: row.title,
    xpRequired: row.min_total_xp,
  }
}

export function levelUiToUpsert(level: GamificationLevel) {
  return {
    level_number: level.level,
    title: level.name,
    min_total_xp: level.xpRequired,
    is_active: true,
  }
}

function legacyRuleConfigFromRow(row: BadgeRow): BadgeRuleConfig {
  const trigger: BadgeTriggerType =
    row.rule_type === "disciplines_approved" ? "courses_completed" : "lessons_completed"
  return {
    rules: [
      {
        id: "legacy_1",
        trigger,
        operator: "gte",
        value: row.rule_threshold,
      },
    ],
    matchMode: "all",
  }
}

export function parseRuleConfig(raw: unknown): BadgeRuleConfig | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as BadgeRuleConfig
  if (!Array.isArray(o.rules)) return null
  return o
}

export function badgeRowToUi(row: BadgeRow, earnedCount: number): GamificationBadge {
  const ruleConfig = parseRuleConfig(row.rule_config) ?? legacyRuleConfigFromRow(row)
  const condition =
    ruleConfig.rules.length > 0
      ? generateConditionText(ruleConfig.rules, ruleConfig.matchMode)
      : `${row.rule_type} ≥ ${row.rule_threshold}`

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    icon: row.icon_id,
    condition,
    rarity: row.rarity as GamificationBadge["rarity"],
    earnedCount,
    xpReward: row.xp_reward,
    ruleConfig,
  }
}

/** Extrai colunas legadas + JSON para persistência no Supabase. */
export function badgeUiToDbPayload(
  badge: Omit<GamificationBadge, "id" | "earnedCount"> & { id?: string },
  slug: string,
) {
  const rules = badge.ruleConfig?.rules ?? []
  const first = rules[0]
  let rule_type = "lessons_completed"
  let rule_threshold = 1

  if (first && typeof first.value === "number") {
    rule_threshold = Math.max(1, Math.floor(first.value))
    if (first.trigger === "disciplines_approved" || first.trigger === "courses_completed") {
      rule_type = "disciplines_approved"
    } else if (first.trigger === "lessons_completed") {
      rule_type = "lessons_completed"
    } else {
      rule_type = "lessons_completed"
      rule_threshold = Math.max(rule_threshold, 1)
    }
  }

  return {
    slug,
    name: badge.name,
    description: badge.description,
    icon_id: badge.icon,
    rarity: badge.rarity,
    rule_type,
    rule_threshold,
    xp_reward: badge.xpReward ?? 0,
    rule_config: badge.ruleConfig ?? { rules: [], matchMode: "all" as const },
  }
}

import { fireAuditLog } from "@/lib/auditLogHelpers"
import { supabase } from "@/lib/supabaseClient"

export type XpRuleRow = {
  id: string
  action_key: string
  label: string
  category: string
  xp_value: number
  sort_order: number
  is_active: boolean
}

export type LevelRow = {
  id: string
  level_number: number
  title: string
  min_total_xp: number
  is_active: boolean
}

export type BadgeRuleConfigJson = {
  rules: Array<{
    id: string
    trigger: string
    operator: string
    value: number | boolean
    courseId?: string
  }>
  matchMode: "all" | "any"
}

export type BadgeRow = {
  id: string
  slug: string
  name: string
  description: string | null
  icon_id: string
  rarity: string
  rule_type: string
  rule_threshold: number
  xp_reward: number
  sort_order: number
  is_active: boolean
  rule_config: BadgeRuleConfigJson | null
}

export async function listXpRulesAdmin(): Promise<XpRuleRow[]> {
  const { data, error } = await supabase
    .from("lxp_gamification_xp_rules")
    .select("id,action_key,label,category,xp_value,sort_order,is_active")
    .order("sort_order", { ascending: true })
  if (error) throw error
  return (data ?? []) as XpRuleRow[]
}

export async function updateXpRuleAdmin(
  id: string,
  patch: Partial<Pick<XpRuleRow, "xp_value" | "is_active" | "label" | "category">>,
): Promise<void> {
  const { error } = await supabase
    .from("lxp_gamification_xp_rules")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error

  fireAuditLog({
    action: "gamification.xp_rule.update",
    entityType: "lxp_gamification_xp_rule",
    entityId: id,
    metadata: { label: patch.label, xp_value: patch.xp_value },
  })
}

export async function listLevelsAdmin(): Promise<LevelRow[]> {
  const { data, error } = await supabase
    .from("lxp_gamification_levels")
    .select("id,level_number,title,min_total_xp,is_active")
    .order("level_number", { ascending: true })
  if (error) throw error
  return (data ?? []) as LevelRow[]
}

export async function upsertLevelAdmin(input: {
  level_number: number
  title: string
  min_total_xp: number
  is_active?: boolean
}): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabase.from("lxp_gamification_levels").upsert(
    {
      level_number: input.level_number,
      title: input.title.trim(),
      min_total_xp: input.min_total_xp,
      is_active: input.is_active ?? true,
      updated_at: now,
    },
    { onConflict: "level_number" },
  )
  if (error) throw error
}

export async function deleteLevelByNumberAdmin(levelNumber: number): Promise<void> {
  const { error } = await supabase.from("lxp_gamification_levels").delete().eq("level_number", levelNumber)
  if (error) throw error
}

export async function listBadgesAdmin(): Promise<BadgeRow[]> {
  const { data, error } = await supabase
    .from("lxp_gamification_badges")
    .select(
      "id,slug,name,description,icon_id,rarity,rule_type,rule_threshold,xp_reward,sort_order,is_active,rule_config",
    )
    .order("sort_order", { ascending: true })
  if (error) throw error
  return (data ?? []) as BadgeRow[]
}

export async function createBadgeAdmin(input: {
  slug: string
  name: string
  description?: string | null
  icon_id?: string
  rarity: string
  rule_type: string
  rule_threshold: number
  xp_reward?: number
  sort_order?: number
  rule_config?: BadgeRuleConfigJson | null
}): Promise<void> {
  const { error } = await supabase.from("lxp_gamification_badges").insert({
    slug: input.slug.trim().toLowerCase().replace(/\s+/g, "_"),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    icon_id: input.icon_id ?? "award",
    rarity: input.rarity,
    rule_type: input.rule_type,
    rule_threshold: input.rule_threshold,
    xp_reward: input.xp_reward ?? 0,
    sort_order: input.sort_order ?? 99,
    is_active: true,
    rule_config: input.rule_config ?? null,
  })
  if (error) throw error

  fireAuditLog({
    action: "gamification.badge.create",
    entityType: "lxp_gamification_badge",
    metadata: { name: input.name.trim(), slug: input.slug },
  })
}

export async function updateBadgeAdmin(
  id: string,
  patch: Partial<
    Pick<
      BadgeRow,
      | "name"
      | "description"
      | "icon_id"
      | "rarity"
      | "rule_type"
      | "rule_threshold"
      | "xp_reward"
      | "sort_order"
      | "is_active"
      | "rule_config"
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from("lxp_gamification_badges")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error

  fireAuditLog({
    action: "gamification.badge.update",
    entityType: "lxp_gamification_badge",
    entityId: id,
    metadata: { name: patch.name },
  })
}

export async function deleteBadgeAdmin(id: string): Promise<void> {
  const { error } = await supabase.from("lxp_gamification_badges").delete().eq("id", id)
  if (error) throw error
}

export async function reevaluateAllStudentBadgesAdmin(): Promise<number> {
  const { data, error } = await supabase.rpc("lxp_reevaluate_all_student_badges")
  if (error) throw error
  const payload = data as { students_processed?: number } | null
  const count = payload?.students_processed ?? 0

  fireAuditLog({
    action: "gamification.badges.reevaluate_all",
    entityType: "lxp_gamification_badge",
    metadata: { students_processed: count },
  })

  return count
}

export async function getBadgeEarnedCountsAdmin(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("lxp_student_badge_awards")
    .select("badge_id")
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const id = row.badge_id as string
    counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

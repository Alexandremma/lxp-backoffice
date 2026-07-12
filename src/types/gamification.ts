/** Gamification domain types (UI + Supabase mappers). */

export interface XPAction {
  id: string
  name: string
  description: string
  xpValue: number
  category: "lesson" | "quiz" | "engagement" | "social"
  enabled: boolean
}

export type BadgeTriggerType =
  | "lessons_completed"
  | "courses_completed"
  | "quizzes_passed"
  | "quiz_score"
  | "xp_earned"
  | "streak_days"
  | "forum_posts"
  | "forum_replies"
  | "certificates_earned"
  | "level_reached"
  | "time_spent"
  | "login_count"
  | "first_login"
  | "profile_complete"

export type BadgeOperator = "gte" | "lte" | "eq" | "gt" | "lt"

export interface BadgeRule {
  id: string
  trigger: BadgeTriggerType
  operator: BadgeOperator
  value: number | boolean
  courseId?: string
}

export interface BadgeRuleConfig {
  rules: BadgeRule[]
  matchMode: "all" | "any"
}

export interface GamificationBadge {
  id: string
  name: string
  description: string
  icon: string
  condition: string
  rarity: "common" | "rare" | "epic" | "legendary"
  earnedCount: number
  xpReward?: number
  ruleConfig?: BadgeRuleConfig
}

export interface GamificationLevel {
  level: number
  name: string
  xpRequired: number
}

/** Supabase admin rows (mappers → UI types above). */

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

import {
  BookOpen,
  GraduationCap,
  CheckCircle,
  Target,
  Zap,
  Flame,
  MessageSquare,
  MessagesSquare,
  Award,
  TrendingUp,
  Clock,
  LogIn,
  Star,
  User,
  LucideIcon,
} from "lucide-react"
import { BadgeTriggerType, BadgeOperator, BadgeRule } from "./mock-data"

export interface TriggerConfig {
  label: string
  description: string
  icon: LucideIcon
  valueType: "number" | "boolean"
  unit?: string
  allowCourseFilter: boolean
}

export const BADGE_TRIGGERS: Record<BadgeTriggerType, TriggerConfig> = {
  lessons_completed: {
    label: "Aulas completadas",
    description: "Quantidade de aulas finalizadas",
    icon: BookOpen,
    valueType: "number",
    unit: "aulas",
    allowCourseFilter: true,
  },
  courses_completed: {
    label: "Cursos finalizados",
    description: "Quantidade de cursos 100% concluídos",
    icon: GraduationCap,
    valueType: "number",
    unit: "cursos",
    allowCourseFilter: false,
  },
  quizzes_passed: {
    label: "Quizzes aprovados",
    description: "Quantidade de quizzes com nota >= 70%",
    icon: CheckCircle,
    valueType: "number",
    unit: "quizzes",
    allowCourseFilter: true,
  },
  quiz_score: {
    label: "Nota em quiz",
    description: "Nota obtida em um quiz específico",
    icon: Target,
    valueType: "number",
    unit: "%",
    allowCourseFilter: true,
  },
  xp_earned: {
    label: "XP acumulado",
    description: "Total de pontos de experiência",
    icon: Zap,
    valueType: "number",
    unit: "XP",
    allowCourseFilter: false,
  },
  streak_days: {
    label: "Dias consecutivos",
    description: "Sequência de dias acessando a plataforma",
    icon: Flame,
    valueType: "number",
    unit: "dias",
    allowCourseFilter: false,
  },
  forum_posts: {
    label: "Posts no fórum",
    description: "Quantidade de tópicos criados",
    icon: MessageSquare,
    valueType: "number",
    unit: "posts",
    allowCourseFilter: true,
  },
  forum_replies: {
    label: "Respostas no fórum",
    description: "Quantidade de respostas em tópicos",
    icon: MessagesSquare,
    valueType: "number",
    unit: "respostas",
    allowCourseFilter: true,
  },
  certificates_earned: {
    label: "Certificados obtidos",
    description: "Quantidade de certificados emitidos",
    icon: Award,
    valueType: "number",
    unit: "certificados",
    allowCourseFilter: false,
  },
  level_reached: {
    label: "Nível atingido",
    description: "Nível do aluno no sistema de gamificação",
    icon: TrendingUp,
    valueType: "number",
    unit: "",
    allowCourseFilter: false,
  },
  time_spent: {
    label: "Tempo de estudo",
    description: "Horas totais na plataforma",
    icon: Clock,
    valueType: "number",
    unit: "horas",
    allowCourseFilter: true,
  },
  login_count: {
    label: "Número de logins",
    description: "Quantidade de vezes que acessou",
    icon: LogIn,
    valueType: "number",
    unit: "acessos",
    allowCourseFilter: false,
  },
  first_login: {
    label: "Primeiro acesso",
    description: "Realizou o primeiro login",
    icon: Star,
    valueType: "boolean",
    allowCourseFilter: false,
  },
  profile_complete: {
    label: "Perfil completo",
    description: "Preencheu todos os dados do perfil",
    icon: User,
    valueType: "boolean",
    allowCourseFilter: false,
  },
}

export const BADGE_OPERATORS: Record<BadgeOperator, { label: string; symbol: string }> = {
  gte: { label: "Maior ou igual", symbol: ">=" },
  lte: { label: "Menor ou igual", symbol: "<=" },
  eq: { label: "Igual a", symbol: "=" },
  gt: { label: "Maior que", symbol: ">" },
  lt: { label: "Menor que", symbol: "<" },
}

export function generateConditionText(rules: BadgeRule[], matchMode: "all" | "any"): string {
  if (rules.length === 0) return ""

  const descriptions = rules.map((rule) => {
    const trigger = BADGE_TRIGGERS[rule.trigger]
    const operator = BADGE_OPERATORS[rule.operator]

    if (trigger.valueType === "boolean") {
      return trigger.label
    }

    const unit = trigger.unit ? ` ${trigger.unit}` : ""
    return `${trigger.label} ${operator.symbol} ${rule.value}${unit}`
  })

  const connector = matchMode === "all" ? " E " : " OU "
  return descriptions.join(connector)
}

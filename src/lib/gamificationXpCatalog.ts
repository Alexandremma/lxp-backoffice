import type { XPAction } from "@/lib/mock-data"

/** Catálogo de ações exibidas na aba "Configuração de XP" (ordem do cliente). */
export const XP_ACTION_CATALOG: {
  action_key: string
  name: string
  description: string
  category: XPAction["category"]
}[] = [
  {
    action_key: "lesson_complete",
    name: "Aula Assistida",
    description: "Completar uma aula/vídeo",
    category: "lesson",
  },
  {
    action_key: "daily_login",
    name: "Acesso Diário",
    description: "Fazer login no dia (primeiro acesso do dia)",
    category: "engagement",
  },
  {
    action_key: "streak_7_days",
    name: "Sequência 7 Dias",
    description: "Acessar a plataforma 7 dias seguidos",
    category: "engagement",
  },
  {
    action_key: "lesson_comment",
    name: "Comentário no Fórum",
    description: "Deixar um comentário na seção de comentários da aula",
    category: "social",
  },
  {
    action_key: "lesson_comment_reply",
    name: "Ajudar Colega",
    description: "Responder um comentário na seção de comentários da aula",
    category: "social",
  },
  {
    action_key: "discipline_complete",
    name: "Disciplina concluída",
    description: "Aprovar/concluir todas as aulas de uma disciplina",
    category: "lesson",
  },
]

export const XP_ACTION_KEYS = new Set(XP_ACTION_CATALOG.map((a) => a.action_key))

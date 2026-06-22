import { AlertCircle, CheckCircle2, Circle } from "lucide-react"

export const gradeStatusConfig = {
  current: { label: "Em Andamento", variant: "info" as const, icon: AlertCircle },
  completed: { label: "Concluído", variant: "success" as const, icon: CheckCircle2 },
  upcoming: { label: "Próximo", variant: "secondary" as const, icon: Circle },
} as const

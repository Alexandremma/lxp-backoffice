import { GamificationBadge } from "@/lib/mock-data"
import { getBadgeIcon, RARITY_CONFIG } from "./BadgeDialog"
import { Zap, MoreVertical, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BadgeCardProps {
  badge: GamificationBadge & { xpReward?: number }
  onEdit?: (badge: GamificationBadge) => void
  onDelete?: (badge: GamificationBadge) => void
}

export const BadgeCard = ({ badge, onEdit, onDelete }: BadgeCardProps) => {
  const Icon = getBadgeIcon(badge.icon)
  const config = RARITY_CONFIG[badge.rarity]
  const xpReward = badge.xpReward || 
    (badge.rarity === "legendary" ? 1000 : 
     badge.rarity === "epic" ? 300 : 
     badge.rarity === "rare" ? 150 : 75)

  return (
    <div
      className={`relative rounded-xl border-2 p-6 text-center transition-all hover:shadow-lg ${config.borderColor} ${config.bgColor}`}
    >
      {/* Actions Menu */}
      <div className="absolute right-2 top-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(badge)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(badge)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Icon */}
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl ${config.iconBg}`}
      >
        <Icon className={`h-8 w-8 ${config.textColor}`} />
      </div>

      {/* Name */}
      <h4 className="font-semibold text-foreground">{badge.name}</h4>

      {/* Description */}
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
        {badge.description}
      </p>

      {/* XP Badge */}
      <div
        className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${config.borderColor} ${config.textColor}`}
      >
        <Zap className="h-4 w-4" />
        <span>+{xpReward} XP</span>
      </div>

      {/* Stats */}
      <p className="mt-3 text-xs text-muted-foreground">
        {badge.earnedCount.toLocaleString("pt-BR")} alunos conquistaram
      </p>
    </div>
  )
}

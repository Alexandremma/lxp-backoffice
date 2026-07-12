import { BadgeCard } from "@/components/admin/BadgeCard"
import { RequirePermission } from "@/components/auth/RequirePermission"
import { LoadingSpinner } from "@/components/states/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { GamificationBadge } from "@/types/gamification"
import { Plus, RefreshCw } from "lucide-react"

type GamificationBadgesTabProps = {
  badges: GamificationBadge[]
  canManageBadges: boolean
  canDeleteBadges: boolean
  isReevaluating: boolean
  onReevaluate: () => void
  onNewBadge: () => void
  onEditBadge: (badge: GamificationBadge) => void
  onDeleteBadge: (badge: GamificationBadge) => void
}

export function GamificationBadgesTab({
  badges,
  canManageBadges,
  canDeleteBadges,
  isReevaluating,
  onReevaluate,
  onNewBadge,
  onEditBadge,
  onDeleteBadge,
}: GamificationBadgesTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Conquistas que os alunos podem desbloquear</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <RequirePermission permission="gamificacao.badges_reavaliar">
              <Button variant="outline" disabled={isReevaluating} onClick={onReevaluate}>
                {isReevaluating ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Reavaliar todos os alunos
              </Button>
            </RequirePermission>
            <RequirePermission permission="gamificacao.badges_criar">
              <Button onClick={onNewBadge}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Badge
              </Button>
            </RequirePermission>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {badges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              onEdit={canManageBadges ? onEditBadge : undefined}
              onDelete={canDeleteBadges ? onDeleteBadge : undefined}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

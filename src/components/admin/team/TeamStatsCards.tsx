import { Card, CardContent } from "@/components/ui/card"
import { SkeletonStatCards } from "@/components/ui/skeleton"
import type { TeamRole } from "@/consts/teamRoles"
import { roleConfig } from "@/components/admin/team/teamPageHelpers"

type TeamStatsCardsProps = {
  isLoading: boolean
  countByRole: Record<TeamRole, number>
}

export function TeamStatsCards({ isLoading, countByRole }: TeamStatsCardsProps) {
  if (isLoading) {
    return <SkeletonStatCards count={3} columnsClassName="sm:grid-cols-3" className="mb-6" />
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
      {(Object.keys(roleConfig) as TeamRole[]).map((role) => {
        const Icon = roleConfig[role].icon
        return (
          <Card key={role}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 p-2.5 rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold leading-none">{countByRole[role]}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {roleConfig[role].label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

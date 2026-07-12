import { Card, CardContent } from "@/components/ui/card"
import { Award, Star, TrendingUp, Zap } from "lucide-react"

type GamificationStatsCardsProps = {
  xpActionsCount: number
  badgesCount: number
  levelsCount: number
  totalXPPossible: number
}

export function GamificationStatsCards({
  xpActionsCount,
  badgesCount,
  levelsCount,
  totalXPPossible,
}: GamificationStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{xpActionsCount}</p>
              <p className="text-sm text-muted-foreground">Ações de XP</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{badgesCount}</p>
              <p className="text-sm text-muted-foreground">Badges</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{levelsCount}</p>
              <p className="text-sm text-muted-foreground">Níveis</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalXPPossible}</p>
              <p className="text-sm text-muted-foreground">Soma das ações ativas (1× cada)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

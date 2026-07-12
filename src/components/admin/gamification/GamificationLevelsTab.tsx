import { RequirePermission } from "@/components/auth/RequirePermission"
import { levelProgressValue } from "@/components/admin/gamification/gamificationPageHelpers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { GamificationLevel } from "@/types/gamification"
import { Edit, Plus, Trash2, Trophy } from "lucide-react"

type GamificationLevelsTabProps = {
  levels: GamificationLevel[]
  canEditLevels: boolean
  onNewLevel: () => void
  onEditLevel: (level: GamificationLevel) => void
  onDeleteLevel: (level: GamificationLevel) => void
}

export function GamificationLevelsTab({
  levels,
  canEditLevels,
  onNewLevel,
  onEditLevel,
  onDeleteLevel,
}: GamificationLevelsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Configuração de Níveis</CardTitle>
            <CardDescription>Defina os níveis e XP necessário para cada um</CardDescription>
          </div>
          <RequirePermission permission="gamificacao.niveis_editar">
            <Button onClick={onNewLevel}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Nível
            </Button>
          </RequirePermission>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {levels.map((level, index) => (
            <div
              key={level.level}
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/30"
            >
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <span className="font-bold text-primary-foreground">{level.level}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{level.name}</h4>
                  <Trophy className="h-4 w-4 text-warning" />
                </div>
                <Progress value={levelProgressValue(levels, index)} className="h-2" />
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-bold">
                  {level.xpRequired.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">XP necessário</p>
              </div>
              {canEditLevels ? (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => onEditLevel(level)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDeleteLevel(level)}
                    disabled={levels.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

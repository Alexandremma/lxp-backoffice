import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { getCategoryColor } from "@/components/admin/gamification/gamificationPageHelpers"
import type { XPAction } from "@/types/gamification"
import { Edit, Save, Zap } from "lucide-react"

type GamificationXpTabProps = {
  xpConfig: XPAction[]
  editing: string | null
  canEditXp: boolean
  canPersistAction: (actionId: string) => boolean
  isUpdating: boolean
  onToggle: (action: XPAction) => void
  onStartEdit: (actionId: string) => void
  onSave: (action: XPAction, newValue: number) => void
}

export function GamificationXpTab({
  xpConfig,
  editing,
  canEditXp,
  canPersistAction,
  isUpdating,
  onToggle,
  onStartEdit,
  onSave,
}: GamificationXpTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações que Concedem XP</CardTitle>
        <CardDescription>
          Configure quantos pontos de experiência cada ação concede
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {xpConfig.map((action) => {
            const canPersist = canPersistAction(action.id)
            return (
              <div
                key={action.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${getCategoryColor(action.category)}`}
                  >
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{action.name}</p>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={action.enabled}
                    disabled={!canPersist || isUpdating}
                    onCheckedChange={() => onToggle(action)}
                  />
                  {editing === action.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue={action.xpValue}
                        className="w-20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onSave(action, Number((e.target as HTMLInputElement).value))
                          }
                        }}
                      />
                      {canEditXp ? (
                        <Button
                          size="icon-sm"
                          onClick={(e) => {
                            const input = e.currentTarget.previousSibling as HTMLInputElement
                            onSave(action, Number(input.value))
                          }}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        +{action.xpValue} XP
                      </Badge>
                      {canEditXp ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={!canPersist}
                          onClick={() => onStartEdit(action.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

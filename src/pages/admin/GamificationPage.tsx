import { useMemo, useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import type { GamificationBadge, GamificationLevel, XPAction } from "@/lib/mock-data"
import {
  badgeRowToUi,
  badgeUiToDbPayload,
  levelRowToUi,
  levelUiToUpsert,
  xpRulesToUiActions,
} from "@/lib/gamificationMappers"
import {
  useBadgeEarnedCountsAdmin,
  useGamificationBadgesAdmin,
  useGamificationLevelsAdmin,
  useGamificationXpRulesAdmin,
} from "@/hooks/queries/useGamificationAdmin"
import {
  useCreateBadgeAdmin,
  useDeleteBadgeAdmin,
  useDeleteLevelAdmin,
  useUpdateBadgeAdmin,
  useUpdateXpRuleAdmin,
  useUpsertLevelAdmin,
} from "@/hooks/mutations/useGamificationMutationsAdmin"
import {
  Zap,
  Award,
  Star,
  Trophy,
  Edit,
  Save,
  TrendingUp,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { BadgeDialog } from "@/components/admin/BadgeDialog"
import { BadgeCard } from "@/components/admin/BadgeCard"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"
import { LevelDialog } from "@/components/admin/LevelDialog"

const GamificationPage = () => {
  const rulesQ = useGamificationXpRulesAdmin()
  const levelsQ = useGamificationLevelsAdmin()
  const badgesQ = useGamificationBadgesAdmin()
  const countsQ = useBadgeEarnedCountsAdmin()
  const updateXp = useUpdateXpRuleAdmin()
  const upsertLevel = useUpsertLevelAdmin()
  const deleteLevel = useDeleteLevelAdmin()
  const createBadge = useCreateBadgeAdmin()
  const updateBadge = useUpdateBadgeAdmin()
  const deleteBadge = useDeleteBadgeAdmin()

  const [editing, setEditing] = useState<string | null>(null)
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<GamificationBadge | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [badgeToDelete, setBadgeToDelete] = useState<GamificationBadge | null>(null)
  const [levelDialogOpen, setLevelDialogOpen] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<GamificationLevel | null>(null)
  const [levelDeleteDialogOpen, setLevelDeleteDialogOpen] = useState(false)
  const [levelToDelete, setLevelToDelete] = useState<GamificationLevel | null>(null)

  const xpConfig = useMemo(() => xpRulesToUiActions(rulesQ.data ?? []), [rulesQ.data])
  const levels = useMemo(
    () => (levelsQ.data ?? []).map(levelRowToUi).sort((a, b) => a.level - b.level),
    [levelsQ.data],
  )
  const badges = useMemo(() => {
    const counts = countsQ.data ?? {}
    return (badgesQ.data ?? []).map((row) => badgeRowToUi(row, counts[row.id] ?? 0))
  }, [badgesQ.data, countsQ.data])

  const totalXPPossible = useMemo(
    () => xpConfig.filter((a) => a.enabled).reduce((acc, action) => acc + action.xpValue, 0),
    [xpConfig],
  )

  const loading = rulesQ.isLoading || levelsQ.isLoading || badgesQ.isLoading
  const err =
    rulesQ.error?.message || levelsQ.error?.message || badgesQ.error?.message || countsQ.error?.message

  const ruleIdByKey = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of rulesQ.data ?? []) {
      m.set(r.action_key, r.id)
    }
    return m
  }, [rulesQ.data])

  const getCategoryColor = (category: XPAction["category"]) => {
    switch (category) {
      case "lesson":
        return "bg-primary/10 text-primary"
      case "quiz":
        return "bg-success/10 text-success"
      case "engagement":
        return "bg-info/10 text-info"
      case "social":
        return "bg-warning/10 text-warning"
      default:
        return "bg-muted"
    }
  }

  const handleSaveXP = async (action: XPAction, newValue: number) => {
    const resolvedId = ruleIdByKey.get(action.id)
    if (!resolvedId) {
      toast.error("Regra ainda não existe no banco. Aplique a migration de XP (Step 17b).")
      return
    }
    try {
      await updateXp.mutateAsync({ id: resolvedId, patch: { xp_value: newValue } })
      setEditing(null)
      toast.success("Configuração de XP atualizada!")
    } catch {
      toast.error("Não foi possível salvar.")
    }
  }

  const handleToggleXP = async (action: XPAction) => {
    const resolvedId = ruleIdByKey.get(action.id)
    if (!resolvedId) {
      toast.error("Regra não encontrada no Supabase.")
      return
    }
    try {
      await updateXp.mutateAsync({ id: resolvedId, patch: { is_active: !action.enabled } })
      toast.success(action.enabled ? "Ação desativada." : "Ação ativada.")
    } catch {
      toast.error("Não foi possível atualizar.")
    }
  }

  const handleSaveBadge = async (
    badgeData: Omit<GamificationBadge, "id" | "earnedCount"> & { id?: string },
  ) => {
    const existingRow = badgesQ.data?.find((b) => b.id === badgeData.id)
    const slug =
      existingRow?.slug ??
      badgeData.name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "") ||
      `badge_${Date.now()}`
    const payload = badgeUiToDbPayload(badgeData, slug)

    try {
      if (badgeData.id) {
        await updateBadge.mutateAsync({
          id: badgeData.id,
          patch: {
            name: payload.name,
            description: payload.description,
            icon_id: payload.icon_id,
            rarity: payload.rarity,
            rule_type: payload.rule_type,
            rule_threshold: payload.rule_threshold,
            xp_reward: payload.xp_reward,
            rule_config: payload.rule_config,
          },
        })
      } else {
        await createBadge.mutateAsync(payload)
      }
      setSelectedBadge(null)
    } catch {
      toast.error("Não foi possível salvar o badge.")
    }
  }

  const handleEditBadge = (badge: GamificationBadge) => {
    setSelectedBadge(badge)
    setBadgeDialogOpen(true)
  }

  const handleDeleteBadge = (badge: GamificationBadge) => {
    setBadgeToDelete(badge)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteBadge = async () => {
    if (!badgeToDelete) return
    try {
      await deleteBadge.mutateAsync(badgeToDelete.id)
      toast.success("Badge excluído!")
    } catch {
      toast.error("Não foi possível excluir.")
    }
    setDeleteDialogOpen(false)
    setBadgeToDelete(null)
  }

  const handleEditLevel = (level: GamificationLevel) => {
    setSelectedLevel(level)
    setLevelDialogOpen(true)
  }

  const handleDeleteLevel = (level: GamificationLevel) => {
    if (levels.length <= 1) {
      toast.error("Não é possível excluir o único nível restante")
      return
    }
    setLevelToDelete(level)
    setLevelDeleteDialogOpen(true)
  }

  const handleSaveLevel = async (levelData: GamificationLevel) => {
    try {
      await upsertLevel.mutateAsync(levelUiToUpsert(levelData))
      toast.success(selectedLevel ? "Nível atualizado!" : "Nível criado!")
      setSelectedLevel(null)
      setLevelDialogOpen(false)
    } catch {
      toast.error("Não foi possível salvar o nível.")
    }
  }

  const confirmDeleteLevel = async () => {
    if (!levelToDelete) return
    try {
      await deleteLevel.mutateAsync(levelToDelete.level)
      toast.success("Nível excluído!")
    } catch {
      toast.error("Não foi possível excluir.")
    }
    setLevelDeleteDialogOpen(false)
    setLevelToDelete(null)
  }

  return (
    <AdminLayout>
      <PageHeader title="Gamificação" description="Configure XP, badges e regras de níveis" />

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando…
        </div>
      ) : err ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive text-base">Erro</CardTitle>
            <CardDescription>{err}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => void rulesQ.refetch()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{xpConfig.length}</p>
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
                    <p className="text-2xl font-bold">{badges.length}</p>
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
                    <p className="text-2xl font-bold">{levels.length}</p>
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
                    <p className="text-sm text-muted-foreground">XP por Ciclo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="xp" className="space-y-4">
            <TabsList>
              <TabsTrigger value="xp">Configuração de XP</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="levels">Níveis</TabsTrigger>
            </TabsList>

            <TabsContent value="xp" className="space-y-4">
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
                      const canPersist = Boolean(ruleIdByKey.get(action.id))
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
                              disabled={!canPersist || updateXp.isPending}
                              onCheckedChange={() => void handleToggleXP(action)}
                            />
                            {editing === action.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  defaultValue={action.xpValue}
                                  className="w-20"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveXP(
                                        action,
                                        Number((e.target as HTMLInputElement).value),
                                      )
                                    }
                                  }}
                                />
                                <Button
                                  size="icon-sm"
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousSibling as HTMLInputElement
                                    void handleSaveXP(action, Number(input.value))
                                  }}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-mono">
                                  +{action.xpValue} XP
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={!canPersist}
                                  onClick={() => setEditing(action.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badges" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Badges</CardTitle>
                      <CardDescription>Conquistas que os alunos podem desbloquear</CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedBadge(null)
                        setBadgeDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Badge
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {badges.map((badge) => (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        onEdit={handleEditBadge}
                        onDelete={handleDeleteBadge}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="levels" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Configuração de Níveis</CardTitle>
                      <CardDescription>Defina os níveis e XP necessário para cada um</CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedLevel(null)
                        setLevelDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Nível
                    </Button>
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
                          <Progress
                            value={
                              index < levels.length - 1
                                ? ((level.xpRequired - (levels[index - 1]?.xpRequired || 0)) /
                                    (levels[levels.length - 1].xpRequired || 1)) *
                                  100
                                : 100
                            }
                            className="h-2"
                          />
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-bold">
                            {level.xpRequired.toLocaleString("pt-BR")}
                          </p>
                          <p className="text-xs text-muted-foreground">XP necessário</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleEditLevel(level)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteLevel(level)}
                            disabled={levels.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <BadgeDialog
            open={badgeDialogOpen}
            onOpenChange={setBadgeDialogOpen}
            badge={selectedBadge}
            onSave={(data) => void handleSaveBadge(data)}
          />

          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={() => void confirmDeleteBadge()}
            title="Excluir Badge"
            description={`Tem certeza que deseja excluir o badge "${badgeToDelete?.name}"? Esta ação não pode ser desfeita.`}
          />

          <LevelDialog
            open={levelDialogOpen}
            onOpenChange={setLevelDialogOpen}
            level={selectedLevel}
            onSave={(data) => void handleSaveLevel(data)}
            existingLevels={levels}
          />

          <DeleteConfirmDialog
            open={levelDeleteDialogOpen}
            onOpenChange={setLevelDeleteDialogOpen}
            onConfirm={() => void confirmDeleteLevel()}
            title="Excluir Nível"
            description={`Tem certeza que deseja excluir o nível ${levelToDelete?.level} "${levelToDelete?.name}"? Esta ação não pode ser desfeita.`}
          />
        </>
      )}
    </AdminLayout>
  )
}

export default GamificationPage

import { useMemo, useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { GamificationBadge, GamificationLevel, XPAction } from "@/types/gamification"
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
  useReevaluateAllBadgesAdmin,
  useUpdateBadgeAdmin,
  useUpdateXpRuleAdmin,
  useUpsertLevelAdmin,
} from "@/hooks/mutations/useGamificationMutationsAdmin"
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { usePermission } from "@/hooks/usePermission"
import { GamificationStatsCards } from "@/components/admin/gamification/GamificationStatsCards"
import { GamificationXpTab } from "@/components/admin/gamification/GamificationXpTab"
import { GamificationBadgesTab } from "@/components/admin/gamification/GamificationBadgesTab"
import { GamificationLevelsTab } from "@/components/admin/gamification/GamificationLevelsTab"
import { GamificationPageDialogs } from "@/components/admin/gamification/GamificationPageDialogs"
import { badgeSlugFromName } from "@/components/admin/gamification/gamificationPageHelpers"

const GamificationPage = () => {
  const { can } = usePermission()
  const canEditXp = can("gamificacao.xp_editar")
  const canManageBadges = can("gamificacao.badges_editar")
  const canEditLevels = can("gamificacao.niveis_editar")
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
  const reevaluateBadges = useReevaluateAllBadgesAdmin()

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
    const slug = existingRow?.slug ?? badgeSlugFromName(badgeData.name)
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
        <div className="space-y-6">
          <SkeletonStatCards className="mb-2" />
          <SkeletonTable rows={6} columns={4} />
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
          <GamificationStatsCards
            xpActionsCount={xpConfig.length}
            badgesCount={badges.length}
            levelsCount={levels.length}
            totalXPPossible={totalXPPossible}
          />

          <Tabs defaultValue="xp" className="space-y-4">
            <TabsList>
              <TabsTrigger value="xp">Configuração de XP</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="levels">Níveis</TabsTrigger>
            </TabsList>

            <TabsContent value="xp" className="space-y-4">
              <GamificationXpTab
                xpConfig={xpConfig}
                editing={editing}
                canEditXp={canEditXp}
                canPersistAction={(actionId) => Boolean(ruleIdByKey.get(actionId))}
                isUpdating={updateXp.isPending}
                onToggle={(action) => void handleToggleXP(action)}
                onStartEdit={setEditing}
                onSave={(action, value) => void handleSaveXP(action, value)}
              />
            </TabsContent>

            <TabsContent value="badges" className="space-y-4">
              <GamificationBadgesTab
                badges={badges}
                canManageBadges={canManageBadges}
                canDeleteBadges={can("gamificacao.badges_excluir")}
                isReevaluating={reevaluateBadges.isPending}
                onReevaluate={() => {
                  void reevaluateBadges
                    .mutateAsync()
                    .then((n) => {
                      toast.success(`Badges reavaliados para ${n} aluno(s).`)
                    })
                    .catch(() => {
                      toast.error("Não foi possível reavaliar os badges.")
                    })
                }}
                onNewBadge={() => {
                  setSelectedBadge(null)
                  setBadgeDialogOpen(true)
                }}
                onEditBadge={handleEditBadge}
                onDeleteBadge={handleDeleteBadge}
              />
            </TabsContent>

            <TabsContent value="levels" className="space-y-4">
              <GamificationLevelsTab
                levels={levels}
                canEditLevels={canEditLevels}
                onNewLevel={() => {
                  setSelectedLevel(null)
                  setLevelDialogOpen(true)
                }}
                onEditLevel={handleEditLevel}
                onDeleteLevel={handleDeleteLevel}
              />
            </TabsContent>
          </Tabs>

          <GamificationPageDialogs
            badgeDialogOpen={badgeDialogOpen}
            onBadgeDialogOpenChange={setBadgeDialogOpen}
            selectedBadge={selectedBadge}
            onSaveBadge={(data) => void handleSaveBadge(data)}
            deleteDialogOpen={deleteDialogOpen}
            onDeleteDialogOpenChange={setDeleteDialogOpen}
            badgeToDelete={badgeToDelete}
            onConfirmDeleteBadge={() => void confirmDeleteBadge()}
            levelDialogOpen={levelDialogOpen}
            onLevelDialogOpenChange={setLevelDialogOpen}
            selectedLevel={selectedLevel}
            onSaveLevel={(data) => void handleSaveLevel(data)}
            levels={levels}
            levelDeleteDialogOpen={levelDeleteDialogOpen}
            onLevelDeleteDialogOpenChange={setLevelDeleteDialogOpen}
            levelToDelete={levelToDelete}
            onConfirmDeleteLevel={() => void confirmDeleteLevel()}
          />
        </>
      )}
    </AdminLayout>
  )
}

export default GamificationPage

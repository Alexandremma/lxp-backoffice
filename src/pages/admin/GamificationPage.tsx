import { useMemo, useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { BadgeRow } from "@/services/gamificationAdminService"
import { Award, Edit, Loader2, Plus, Save, Star, Trash2, TrendingUp, Zap } from "lucide-react"
import { toast } from "sonner"

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

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [editXpValue, setEditXpValue] = useState("")

  const [levelDialog, setLevelDialog] = useState(false)
  const [levelNum, setLevelNum] = useState("1")
  const [levelTitle, setLevelTitle] = useState("")
  const [levelMinXp, setLevelMinXp] = useState("0")

  const [badgeDialog, setBadgeDialog] = useState(false)
  const [badgeSlug, setBadgeSlug] = useState("")
  const [badgeName, setBadgeName] = useState("")
  const [badgeDesc, setBadgeDesc] = useState("")
  const [badgeRuleType, setBadgeRuleType] = useState<"lessons_completed" | "disciplines_approved">("lessons_completed")
  const [badgeThreshold, setBadgeThreshold] = useState("5")
  const [badgeRarity, setBadgeRarity] = useState<BadgeRow["rarity"]>("common")

  const rules = rulesQ.data ?? []
  const levels = levelsQ.data ?? []
  const badges = badgesQ.data ?? []
  const counts = countsQ.data ?? {}

  const totalXpConfigured = useMemo(() => rules.reduce((s, r) => s + (r.is_active ? r.xp_value : 0), 0), [rules])

  const loading = rulesQ.isLoading || levelsQ.isLoading || badgesQ.isLoading
  const err =
    rulesQ.error?.message || levelsQ.error?.message || badgesQ.error?.message || countsQ.error?.message

  const saveRuleXp = async (id: string) => {
    const v = Number.parseInt(editXpValue, 10)
    if (Number.isNaN(v) || v < 0 || v > 10000) {
      toast.error("XP inválido (0–10000).")
      return
    }
    try {
      await updateXp.mutateAsync({ id, patch: { xp_value: v } })
      toast.success("Regra atualizada.")
      setEditingRuleId(null)
    } catch {
      toast.error("Não foi possível salvar.")
    }
  }

  const toggleRule = async (id: string, is_active: boolean) => {
    try {
      await updateXp.mutateAsync({ id, patch: { is_active: !is_active } })
      toast.success(is_active ? "Regra desativada." : "Regra ativada.")
    } catch {
      toast.error("Não foi possível atualizar.")
    }
  }

  const openAddLevel = () => {
    setLevelNum(String((levels[levels.length - 1]?.level_number ?? 0) + 1))
    setLevelTitle("")
    setLevelMinXp("0")
    setLevelDialog(true)
  }

  const saveLevel = async () => {
    const n = Number.parseInt(levelNum, 10)
    const xp = Number.parseInt(levelMinXp, 10)
    if (Number.isNaN(n) || n < 1 || Number.isNaN(xp) || xp < 0) {
      toast.error("Nível ou XP mínimo inválido.")
      return
    }
    if (!levelTitle.trim()) {
      toast.error("Informe o título do nível.")
      return
    }
    try {
      await upsertLevel.mutateAsync({ level_number: n, title: levelTitle, min_total_xp: xp })
      toast.success("Nível salvo.")
      setLevelDialog(false)
    } catch {
      toast.error("Não foi possível salvar o nível.")
    }
  }

  const saveNewBadge = async () => {
    const th = Number.parseInt(badgeThreshold, 10)
    if (!badgeSlug.trim() || !badgeName.trim() || Number.isNaN(th) || th < 1) {
      toast.error("Preencha slug, nome e limiar (>=1).")
      return
    }
    try {
      await createBadge.mutateAsync({
        slug: badgeSlug,
        name: badgeName,
        description: badgeDesc || null,
        rarity: badgeRarity,
        rule_type: badgeRuleType,
        rule_threshold: th,
      })
      toast.success("Badge criado.")
      setBadgeDialog(false)
      setBadgeSlug("")
      setBadgeName("")
      setBadgeDesc("")
      setBadgeThreshold("5")
    } catch {
      toast.error("Não foi possível criar (slug duplicado?).")
    }
  }

  return (
    <AdminLayout>
      <PageHeader title="Gamificação" description="XP por ação (aula/disciplina), níveis e badges — dados no Supabase" />

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
                    <p className="text-2xl font-bold">{rules.length}</p>
                    <p className="text-sm text-muted-foreground">Regras de XP</p>
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
                    <p className="text-2xl font-bold">{totalXpConfigured}</p>
                    <p className="text-sm text-muted-foreground">XP máx. (regras ativas)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="xp" className="space-y-4">
            <TabsList>
              <TabsTrigger value="xp">XP por ação</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="levels">Níveis</TabsTrigger>
            </TabsList>

            <TabsContent value="xp">
              <Card>
                <CardHeader>
                  <CardTitle>Regras</CardTitle>
                  <CardDescription>
                    Valores aplicados automaticamente ao concluir aula ou disciplina (triggers no banco).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rules.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">{r.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{r.action_key}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={r.is_active} onCheckedChange={() => void toggleRule(r.id, r.is_active)} />
                        {editingRuleId === r.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              className="w-24"
                              value={editXpValue}
                              onChange={(e) => setEditXpValue(e.target.value)}
                              type="number"
                            />
                            <Button size="icon-sm" onClick={() => void saveRuleXp(r.id)}>
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Badge variant="secondary" className="font-mono">
                              +{r.xp_value} XP
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditingRuleId(r.id)
                                setEditXpValue(String(r.xp_value))
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badges">
              <div className="flex justify-end mb-3">
                <Button onClick={() => setBadgeDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo badge
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {badges.map((b) => (
                  <Card key={b.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between gap-2">
                        <CardTitle className="text-base">{b.name}</CardTitle>
                        <Badge variant="outline" className="shrink-0">
                          {b.rarity}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{b.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        Regra: {b.rule_type} ≥ {b.rule_threshold}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(counts[b.id] ?? 0).toLocaleString("pt-BR")} alunos com este badge
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const next = !b.is_active
                            try {
                              await updateBadge.mutateAsync({ id: b.id, patch: { is_active: next } })
                              toast.success(next ? "Ativado." : "Desativado.")
                            } catch {
                              toast.error("Erro ao atualizar.")
                            }
                          }}
                        >
                          {b.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={async () => {
                            if (!confirm("Excluir badge? Conquistas dos alunos serão removidas (FK cascade).")) return
                            try {
                              await deleteBadge.mutateAsync(b.id)
                              toast.success("Removido.")
                            } catch {
                              toast.error("Não foi possível excluir.")
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="levels">
              <div className="flex justify-end mb-3">
                <Button onClick={openAddLevel}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo nível
                </Button>
              </div>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  {levels.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between border-b border-border/60 py-2 last:border-0"
                    >
                      <div>
                        <span className="font-semibold mr-2">Nível {l.level_number}</span>
                        <span className="text-muted-foreground">{l.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">min {l.min_total_xp} XP</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={levels.length <= 1}
                          onClick={async () => {
                            if (!confirm("Excluir este nível?")) return
                            try {
                              await deleteLevel.mutateAsync(l.level_number)
                              toast.success("Nível removido.")
                            } catch {
                              toast.error("Erro ao excluir.")
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={levelDialog} onOpenChange={setLevelDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nível</DialogTitle>
                <DialogDescription>Número único e XP mínimo acumulado para alcançar o nível.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label>Número</Label>
                  <Input value={levelNum} onChange={(e) => setLevelNum(e.target.value)} type="number" />
                </div>
                <div>
                  <Label>Título</Label>
                  <Input value={levelTitle} onChange={(e) => setLevelTitle(e.target.value)} />
                </div>
                <div>
                  <Label>XP mínimo total</Label>
                  <Input value={levelMinXp} onChange={(e) => setLevelMinXp(e.target.value)} type="number" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLevelDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => void saveLevel()} disabled={upsertLevel.isPending}>
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={badgeDialog} onOpenChange={setBadgeDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo badge</DialogTitle>
                <DialogDescription>Slug único (ex.: minha_meta). Regras simples por contagem.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label>Slug</Label>
                  <Input value={badgeSlug} onChange={(e) => setBadgeSlug(e.target.value)} placeholder="ex.: cinco_aulas" />
                </div>
                <div>
                  <Label>Nome</Label>
                  <Input value={badgeName} onChange={(e) => setBadgeName(e.target.value)} />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input value={badgeDesc} onChange={(e) => setBadgeDesc(e.target.value)} />
                </div>
                <div>
                  <Label>Tipo de regra</Label>
                  <Select value={badgeRuleType} onValueChange={(v) => setBadgeRuleType(v as typeof badgeRuleType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lessons_completed">Aulas concluídas</SelectItem>
                      <SelectItem value="disciplines_approved">Disciplinas aprovadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Limiar (N)</Label>
                  <Input value={badgeThreshold} onChange={(e) => setBadgeThreshold(e.target.value)} type="number" />
                </div>
                <div>
                  <Label>Raridade</Label>
                  <Select value={badgeRarity} onValueChange={(v) => setBadgeRarity(v as BadgeRow["rarity"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">common</SelectItem>
                      <SelectItem value="rare">rare</SelectItem>
                      <SelectItem value="epic">epic</SelectItem>
                      <SelectItem value="legendary">legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBadgeDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => void saveNewBadge()} disabled={createBadge.isPending}>
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AdminLayout>
  )
}

export default GamificationPage

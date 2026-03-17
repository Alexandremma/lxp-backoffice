import { useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  mockXPConfig,
  mockBadges,
  mockLevels,
  XPAction,
  GamificationBadge,
  GamificationLevel,
} from "@/lib/mock-data"
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
} from "lucide-react"
import { toast } from "sonner"
import { BadgeDialog } from "@/components/admin/BadgeDialog"
import { BadgeCard } from "@/components/admin/BadgeCard"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"
import { LevelDialog } from "@/components/admin/LevelDialog"

const GamificationPage = () => {
  const [xpConfig, setXpConfig] = useState<XPAction[]>(mockXPConfig)
  const [badges, setBadges] = useState<GamificationBadge[]>(mockBadges)
  const [levels, setLevels] = useState<GamificationLevel[]>(mockLevels)
  const [editing, setEditing] = useState<string | null>(null)
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<GamificationBadge | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [badgeToDelete, setBadgeToDelete] = useState<GamificationBadge | null>(null)
  const [levelDialogOpen, setLevelDialogOpen] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<GamificationLevel | null>(null)
  const [levelDeleteDialogOpen, setLevelDeleteDialogOpen] = useState(false)
  const [levelToDelete, setLevelToDelete] = useState<GamificationLevel | null>(null)

  const handleSaveXP = (actionId: string, newValue: number) => {
    setXpConfig(
      xpConfig.map((action) =>
        action.id === actionId ? { ...action, xpValue: newValue } : action
      )
    )
    setEditing(null)
    toast.success("Configuração de XP atualizada!")
  }

  const totalXPPossible = xpConfig.reduce((acc, action) => acc + action.xpValue, 0)

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

  const handleSaveBadge = (
    badgeData: Omit<GamificationBadge, "id" | "earnedCount"> & { id?: string }
  ) => {
    if (badgeData.id) {
      // Update existing
      setBadges(
        badges.map((b) =>
          b.id === badgeData.id ? { ...b, ...badgeData } : b
        )
      )
    } else {
      // Create new
      const newBadge: GamificationBadge = {
        ...badgeData,
        id: `badge_${Date.now()}`,
        earnedCount: 0,
      }
      setBadges([...badges, newBadge])
    }
    setSelectedBadge(null)
  }

  const handleEditBadge = (badge: GamificationBadge) => {
    setSelectedBadge(badge)
    setBadgeDialogOpen(true)
  }

  const handleDeleteBadge = (badge: GamificationBadge) => {
    setBadgeToDelete(badge)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteBadge = () => {
    if (badgeToDelete) {
      setBadges(badges.filter((b) => b.id !== badgeToDelete.id))
      toast.success("Badge excluído!")
    }
    setDeleteDialogOpen(false)
    setBadgeToDelete(null)
  }

  // Level handlers
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

  const handleSaveLevel = (levelData: GamificationLevel) => {
    if (selectedLevel) {
      // Update existing
      setLevels(
        levels.map((l) =>
          l.level === selectedLevel.level ? levelData : l
        ).sort((a, b) => a.level - b.level)
      )
    } else {
      // Create new
      setLevels([...levels, levelData].sort((a, b) => a.level - b.level))
    }
    setSelectedLevel(null)
  }

  const confirmDeleteLevel = () => {
    if (levelToDelete) {
      setLevels(levels.filter((l) => l.level !== levelToDelete.level))
      toast.success("Nível excluído!")
    }
    setLevelDeleteDialogOpen(false)
    setLevelToDelete(null)
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Gamificação"
        description="Configure XP, badges e regras de níveis"
      />

      {/* Stats */}
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

        {/* XP Configuration */}
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
                {xpConfig.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getCategoryColor(action.category)}`}>
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{action.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={action.enabled}
                          onCheckedChange={() =>
                            setXpConfig(
                              xpConfig.map((a) =>
                                a.id === action.id
                                  ? { ...a, enabled: !a.enabled }
                                  : a
                              )
                            )
                          }
                        />
                      </div>
                      {editing === action.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            defaultValue={action.xpValue}
                            className="w-20"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveXP(
                                  action.id,
                                  Number((e.target as HTMLInputElement).value)
                                )
                              }
                            }}
                          />
                          <Button
                            size="icon-sm"
                            onClick={(e) => {
                              const input = e.currentTarget.previousSibling as HTMLInputElement
                              handleSaveXP(action.id, Number(input.value))
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
                            onClick={() => setEditing(action.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Badges</CardTitle>
                  <CardDescription>
                    Conquistas que os alunos podem desbloquear
                  </CardDescription>
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

        {/* Levels */}
        <TabsContent value="levels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configuração de Níveis</CardTitle>
                  <CardDescription>
                    Defina os níveis e XP necessário para cada um
                  </CardDescription>
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
                      <span className="font-bold text-primary-foreground">
                        {level.level}
                      </span>
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
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEditLevel(level)}
                      >
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

      {/* Badge Dialog */}
      <BadgeDialog
        open={badgeDialogOpen}
        onOpenChange={setBadgeDialogOpen}
        badge={selectedBadge}
        onSave={handleSaveBadge}
      />

      {/* Delete Badge Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteBadge}
        title="Excluir Badge"
        description={`Tem certeza que deseja excluir o badge "${badgeToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />

      {/* Level Dialog */}
      <LevelDialog
        open={levelDialogOpen}
        onOpenChange={setLevelDialogOpen}
        level={selectedLevel}
        onSave={handleSaveLevel}
        existingLevels={levels}
      />

      {/* Delete Level Confirmation */}
      <DeleteConfirmDialog
        open={levelDeleteDialogOpen}
        onOpenChange={setLevelDeleteDialogOpen}
        onConfirm={confirmDeleteLevel}
        title="Excluir Nível"
        description={`Tem certeza que deseja excluir o nível ${levelToDelete?.level} "${levelToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </AdminLayout>
  )
}

export default GamificationPage

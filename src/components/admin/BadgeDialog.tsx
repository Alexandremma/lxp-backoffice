import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GamificationBadge, BadgeRule } from "@/lib/mock-data"
import { generateConditionText } from "@/lib/badge-rules"
import { BadgeRuleBuilder } from "./BadgeRuleBuilder"
import { toast } from "sonner"
import {
  Award,
  Zap,
  Target,
  Flame,
  Star,
  Trophy,
  Medal,
  Crown,
  Heart,
  Rocket,
  Lightbulb,
  BookOpen,
  Users,
  CheckCircle,
} from "lucide-react"

const BADGE_ICONS = [
  { id: "award", icon: Award, label: "Medalha" },
  { id: "zap", icon: Zap, label: "Raio" },
  { id: "target", icon: Target, label: "Alvo" },
  { id: "flame", icon: Flame, label: "Chama" },
  { id: "star", icon: Star, label: "Estrela" },
  { id: "trophy", icon: Trophy, label: "Troféu" },
  { id: "medal", icon: Medal, label: "Medalha 2" },
  { id: "crown", icon: Crown, label: "Coroa" },
  { id: "heart", icon: Heart, label: "Coração" },
  { id: "rocket", icon: Rocket, label: "Foguete" },
  { id: "lightbulb", icon: Lightbulb, label: "Ideia" },
  { id: "book", icon: BookOpen, label: "Livro" },
  { id: "users", icon: Users, label: "Colaboração" },
  { id: "check", icon: CheckCircle, label: "Concluído" },
]

export const getBadgeIcon = (iconId: string) => {
  return BADGE_ICONS.find((i) => i.id === iconId)?.icon || Award
}

const RARITY_CONFIG = {
  common: {
    label: "Comum",
    borderColor: "border-muted-foreground/50",
    bgColor: "bg-muted/20",
    iconBg: "bg-muted",
    textColor: "text-muted-foreground",
  },
  rare: {
    label: "Raro",
    borderColor: "border-emerald-500",
    bgColor: "bg-emerald-500/10",
    iconBg: "bg-emerald-500/20",
    textColor: "text-emerald-500",
  },
  epic: {
    label: "Épico",
    borderColor: "border-purple-500",
    bgColor: "bg-purple-500/10",
    iconBg: "bg-purple-500/20",
    textColor: "text-purple-500",
  },
  legendary: {
    label: "Lendário",
    borderColor: "border-amber-500",
    bgColor: "bg-amber-500/10",
    iconBg: "bg-amber-500/20",
    textColor: "text-amber-500",
  },
}

export { RARITY_CONFIG, BADGE_ICONS }

interface BadgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  badge?: GamificationBadge | null
  onSave: (badge: Omit<GamificationBadge, "id" | "earnedCount"> & { id?: string }) => void
}

export const BadgeDialog = ({
  open,
  onOpenChange,
  badge,
  onSave,
}: BadgeDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "award",
    rarity: "common" as GamificationBadge["rarity"],
    xpReward: 100,
    rules: [] as BadgeRule[],
    matchMode: "all" as "all" | "any",
  })

  useEffect(() => {
    if (badge) {
      setFormData({
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity,
        xpReward: badge.xpReward || 100,
        rules: badge.ruleConfig?.rules || [],
        matchMode: badge.ruleConfig?.matchMode || "all",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        icon: "award",
        rarity: "common",
        xpReward: 100,
        rules: [],
        matchMode: "all",
      })
    }
  }, [badge, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Nome do badge é obrigatório")
      return
    }

    if (!formData.description.trim()) {
      toast.error("Descrição é obrigatória")
      return
    }

    if (formData.rules.length === 0) {
      toast.error("Adicione pelo menos uma regra de conquista")
      return
    }

    const conditionText = generateConditionText(formData.rules, formData.matchMode)

    onSave({
      ...(badge?.id && { id: badge.id }),
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      condition: conditionText,
      rarity: formData.rarity,
      xpReward: formData.xpReward,
      ruleConfig: {
        rules: formData.rules,
        matchMode: formData.matchMode,
      },
    })

    onOpenChange(false)
    toast.success(badge ? "Badge atualizado!" : "Badge criado!")
  }

  const SelectedIcon = getBadgeIcon(formData.icon)
  const rarityConfig = RARITY_CONFIG[formData.rarity]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{badge ? "Editar Badge" : "Novo Badge"}</DialogTitle>
          <DialogDescription>
            {badge
              ? "Atualize as informações do badge"
              : "Configure as informações do novo badge de conquista"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div
              className={`w-40 rounded-xl border-2 p-4 text-center ${rarityConfig.borderColor} ${rarityConfig.bgColor}`}
            >
              <div
                className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl ${rarityConfig.iconBg}`}
              >
                <SelectedIcon className={`h-7 w-7 ${rarityConfig.textColor}`} />
              </div>
              <p className="text-sm font-semibold truncate">
                {formData.name || "Nome do Badge"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {formData.description || "Descrição"}
              </p>
              <div
                className={`mt-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${rarityConfig.borderColor} ${rarityConfig.textColor}`}
              >
                <Zap className="h-3 w-3" />
                <span>+{formData.xpReward} XP</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Ex: Lenda Acadêmica"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="O que o aluno precisa fazer para ganhar este badge"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) =>
                    setFormData({ ...formData, icon: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_ICONS.map((item) => {
                      const IconComp = item.icon
                      return (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center gap-2">
                            <IconComp className="h-4 w-4" />
                            <span>{item.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Raridade</Label>
                <Select
                  value={formData.rarity}
                  onValueChange={(value: GamificationBadge["rarity"]) =>
                    setFormData({ ...formData, rarity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Comum</SelectItem>
                    <SelectItem value="rare">Raro</SelectItem>
                    <SelectItem value="epic">Épico</SelectItem>
                    <SelectItem value="legendary">Lendário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="xpReward">Recompensa XP</Label>
              <Input
                id="xpReward"
                type="number"
                min={0}
                value={formData.xpReward}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    xpReward: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Regras de Conquista</Label>
              <BadgeRuleBuilder
                rules={formData.rules}
                matchMode={formData.matchMode}
                onChange={(rules, matchMode) =>
                  setFormData({ ...formData, rules, matchMode })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">{badge ? "Salvar" : "Criar Badge"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

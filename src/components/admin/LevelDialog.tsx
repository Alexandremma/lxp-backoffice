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
import { GamificationLevel } from "@/lib/mock-data"
import { toast } from "sonner"
import { Trophy } from "lucide-react"

interface LevelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  level?: GamificationLevel | null
  onSave: (level: GamificationLevel) => void
  existingLevels: GamificationLevel[]
}

export const LevelDialog = ({
  open,
  onOpenChange,
  level,
  onSave,
  existingLevels,
}: LevelDialogProps) => {
  const [formData, setFormData] = useState({
    level: 1,
    name: "",
    xpRequired: 0,
  })

  const isEditing = !!level

  useEffect(() => {
    if (level) {
      setFormData({
        level: level.level,
        name: level.name,
        xpRequired: level.xpRequired,
      })
    } else {
      // When creating new, suggest next level number
      const maxLevel = existingLevels.length > 0 
        ? Math.max(...existingLevels.map(l => l.level))
        : 0
      const lastLevel = existingLevels.find(l => l.level === maxLevel)
      const suggestedXP = lastLevel ? Math.round(lastLevel.xpRequired * 1.5) : 0
      
      setFormData({
        level: maxLevel + 1,
        name: "",
        xpRequired: suggestedXP,
      })
    }
  }, [level, open, existingLevels])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Nome do nível é obrigatório")
      return
    }

    if (formData.level < 1) {
      toast.error("O número do nível deve ser maior que 0")
      return
    }

    if (formData.xpRequired < 0) {
      toast.error("XP necessário não pode ser negativo")
      return
    }

    // Check for duplicate level number (only when creating or changing level number)
    if (!isEditing || level?.level !== formData.level) {
      const duplicateLevel = existingLevels.find(l => l.level === formData.level)
      if (duplicateLevel) {
        toast.error(`Já existe um nível ${formData.level}`)
        return
      }
    }

    onSave({
      level: formData.level,
      name: formData.name,
      xpRequired: formData.xpRequired,
    })

    onOpenChange(false)
    toast.success(isEditing ? "Nível atualizado!" : "Nível criado!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Nível" : "Novo Nível"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do nível"
              : "Configure um novo nível de progressão"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 w-full">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shrink-0">
                <span className="font-bold text-lg text-primary-foreground">
                  {formData.level}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold truncate">
                    {formData.name || "Nome do Nível"}
                  </h4>
                  <Trophy className="h-4 w-4 text-warning shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.xpRequired.toLocaleString("pt-BR")} XP necessário
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="levelNumber">Número do Nível</Label>
                <Input
                  id="levelNumber"
                  type="number"
                  min={1}
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({ ...formData, level: parseInt(e.target.value) || 1 })
                  }
                  disabled={isEditing}
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    O número do nível não pode ser alterado
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="xpRequired">XP Necessário</Label>
                <Input
                  id="xpRequired"
                  type="number"
                  min={0}
                  value={formData.xpRequired}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      xpRequired: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Nível</Label>
              <Input
                id="name"
                placeholder="Ex: Mestre, Especialista, Lenda..."
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                maxLength={50}
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
            <Button type="submit">{isEditing ? "Salvar" : "Criar Nível"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

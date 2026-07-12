import { BadgeDialog } from "@/components/admin/BadgeDialog"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"
import { LevelDialog } from "@/components/admin/LevelDialog"
import type { GamificationBadge, GamificationLevel } from "@/types/gamification"

type GamificationPageDialogsProps = {
  badgeDialogOpen: boolean
  onBadgeDialogOpenChange: (open: boolean) => void
  selectedBadge: GamificationBadge | null
  onSaveBadge: (
    data: Omit<GamificationBadge, "id" | "earnedCount"> & { id?: string },
  ) => void
  deleteDialogOpen: boolean
  onDeleteDialogOpenChange: (open: boolean) => void
  badgeToDelete: GamificationBadge | null
  onConfirmDeleteBadge: () => void
  levelDialogOpen: boolean
  onLevelDialogOpenChange: (open: boolean) => void
  selectedLevel: GamificationLevel | null
  onSaveLevel: (data: GamificationLevel) => void
  levels: GamificationLevel[]
  levelDeleteDialogOpen: boolean
  onLevelDeleteDialogOpenChange: (open: boolean) => void
  levelToDelete: GamificationLevel | null
  onConfirmDeleteLevel: () => void
}

export function GamificationPageDialogs({
  badgeDialogOpen,
  onBadgeDialogOpenChange,
  selectedBadge,
  onSaveBadge,
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  badgeToDelete,
  onConfirmDeleteBadge,
  levelDialogOpen,
  onLevelDialogOpenChange,
  selectedLevel,
  onSaveLevel,
  levels,
  levelDeleteDialogOpen,
  onLevelDeleteDialogOpenChange,
  levelToDelete,
  onConfirmDeleteLevel,
}: GamificationPageDialogsProps) {
  return (
    <>
      <BadgeDialog
        open={badgeDialogOpen}
        onOpenChange={onBadgeDialogOpenChange}
        badge={selectedBadge}
        onSave={onSaveBadge}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={onDeleteDialogOpenChange}
        onConfirm={onConfirmDeleteBadge}
        title="Excluir Badge"
        description={`Tem certeza que deseja excluir o badge "${badgeToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />

      <LevelDialog
        open={levelDialogOpen}
        onOpenChange={onLevelDialogOpenChange}
        level={selectedLevel}
        onSave={onSaveLevel}
        existingLevels={levels}
      />

      <DeleteConfirmDialog
        open={levelDeleteDialogOpen}
        onOpenChange={onLevelDeleteDialogOpenChange}
        onConfirm={onConfirmDeleteLevel}
        title="Excluir Nível"
        description={`Tem certeza que deseja excluir o nível ${levelToDelete?.level} "${levelToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </>
  )
}

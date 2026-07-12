import {
  TeamMemberDialog,
  type TeamMemberDialogMember,
  type TeamMemberFormData,
} from "@/components/admin/TeamMemberDialog"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"

type TeamPageDialogsProps = {
  dialogOpen: boolean
  onDialogOpenChange: (open: boolean) => void
  member: TeamMemberDialogMember | null
  onSave: (values: TeamMemberFormData) => void
  isSubmitting: boolean
  deleteOpen: boolean
  onDeleteOpenChange: (open: boolean) => void
  deletingMemberName: string | null
  onConfirmDelete: () => void
}

export function TeamPageDialogs({
  dialogOpen,
  onDialogOpenChange,
  member,
  onSave,
  isSubmitting,
  deleteOpen,
  onDeleteOpenChange,
  deletingMemberName,
  onConfirmDelete,
}: TeamPageDialogsProps) {
  return (
    <>
      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={onDialogOpenChange}
        member={member}
        onSave={onSave}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={onDeleteOpenChange}
        title="Remover membro da equipe"
        description={`Tem certeza que deseja remover ${deletingMemberName ?? "este membro"}? A conta Auth vinculada (se existir) não será excluída nesta etapa.`}
        onConfirm={onConfirmDelete}
      />
    </>
  )
}

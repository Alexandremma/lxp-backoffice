import { StudentDetailsDialog } from "@/components/admin/StudentDetailsDialog"
import { StudentDialog, type StudentFormData } from "@/components/admin/StudentDialog"
import {
  StudentProfileEditDialog,
  type StudentProfileEditFormValues,
} from "@/components/admin/StudentProfileEditDialog"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"
import type { StudentAdmin as Student } from "@/types/studentAdmin"

type CourseOption = { id: string; name: string; category?: string }

type StudentsPageDialogsProps = {
  detailsOpen: boolean
  onDetailsOpenChange: (open: boolean) => void
  selectedStudent: Student | null
  dialogOpen: boolean
  onDialogOpenChange: (open: boolean) => void
  courses: CourseOption[]
  onSaveStudent: (data: StudentFormData) => void
  isCreateSubmitting: boolean
  profileEditStudent: Student | null
  profileEditOpen: boolean
  onProfileEditOpenChange: (open: boolean) => void
  onSaveProfile: (values: StudentProfileEditFormValues) => void
  isProfileSubmitting: boolean
  deleteDialogOpen: boolean
  onDeleteDialogOpenChange: (open: boolean) => void
  deletingStudent: Student | null
  onConfirmDelete: () => void
}

export function StudentsPageDialogs({
  detailsOpen,
  onDetailsOpenChange,
  selectedStudent,
  dialogOpen,
  onDialogOpenChange,
  courses,
  onSaveStudent,
  isCreateSubmitting,
  profileEditStudent,
  profileEditOpen,
  onProfileEditOpenChange,
  onSaveProfile,
  isProfileSubmitting,
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  deletingStudent,
  onConfirmDelete,
}: StudentsPageDialogsProps) {
  return (
    <>
      <StudentDetailsDialog
        open={detailsOpen}
        onOpenChange={onDetailsOpenChange}
        student={selectedStudent}
      />

      <StudentDialog
        open={dialogOpen}
        onOpenChange={onDialogOpenChange}
        student={null}
        courses={courses}
        onSave={onSaveStudent}
        isSubmitting={isCreateSubmitting}
      />

      {profileEditStudent && (
        <StudentProfileEditDialog
          open={profileEditOpen}
          onOpenChange={onProfileEditOpenChange}
          student={profileEditStudent}
          onSubmit={onSaveProfile}
          isSubmitting={isProfileSubmitting}
        />
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={onDeleteDialogOpenChange}
        title="Excluir Aluno"
        description={`Tem certeza que deseja excluir o aluno "${deletingStudent?.name}"? Esta ação não pode ser desfeita e todos os dados do aluno serão perdidos.`}
        onConfirm={onConfirmDelete}
      />
    </>
  )
}

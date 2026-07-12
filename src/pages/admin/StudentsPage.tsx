import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle } from "lucide-react"
import type { StudentAdmin as Student } from "@/types/studentAdmin"
import { useGetStudentsAdmin } from "@/hooks/queries/useGetStudentsAdmin"
import { useGetCourses } from "@/hooks/queries/useGetCourses"
import { useState, useMemo } from "react"
import { StudentDialog, type StudentFormData } from "@/components/admin/StudentDialog"
import type { StudentProfileEditFormValues } from "@/components/admin/StudentProfileEditDialog"
import { useUpdateStudentProfile } from "@/hooks/mutations/useUpdateStudentProfile"
import { useCreateStudentAdmin } from "@/hooks/mutations/useCreateStudentAdmin"
import { useDeleteStudentAdmin } from "@/hooks/mutations/useDeleteStudentAdmin"
import { useSetStudentAccessAdmin } from "@/hooks/mutations/useSetStudentAccessAdmin"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PlanLimitBanner } from "@/components/admin/settings/PlanLimitBanner"
import { getAdminErrorMessage } from "@/lib/adminErrorMessage"
import { isPlanLimitError } from "@/lib/planLimits"
import { usePlanLimits } from "@/hooks/queries/usePlanLimits"
import { RequirePermission } from "@/components/auth/RequirePermission"
import { fireAuditLog } from "@/lib/auditLogHelpers"
import { supabase } from "@/lib/supabaseClient"
import { lxpAlunosSetPasswordUrl } from "@/lib/authRedirectUrls"
import { StudentsStatsCards } from "@/components/admin/students/StudentsStatsCards"
import { StudentsToolbar } from "@/components/admin/students/StudentsToolbar"
import { StudentsTable } from "@/components/admin/students/StudentsTable"
import { StudentsPageDialogs } from "@/components/admin/students/StudentsPageDialogs"
import {
  calcAvgProgress,
  courseRowToStudent,
  getEarliestEnrollmentDate,
  type SortColumn,
  type SortDirection,
} from "@/components/admin/students/studentsPageHelpers"

const StudentsPage = () => {
  const {
    data: studentsRaw,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentsAdmin()
  const { data: coursesList } = useGetCourses()
  const updateStudentProfile = useUpdateStudentProfile()
  const createStudent = useCreateStudentAdmin()
  const { usage: planUsage } = usePlanLimits()
  const studentsAtLimit = planUsage?.students.atLimit ?? false
  const deleteStudent = useDeleteStudentAdmin()
  const setStudentAccess = useSetStudentAccessAdmin()

  const students = useMemo(
    () => (studentsRaw ?? []).map(courseRowToStudent),
    [studentsRaw],
  )

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [profileEditStudent, setProfileEditStudent] = useState<Student | null>(null)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [sortColumn, setSortColumn] = useState<SortColumn>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || student.status === statusFilter
      const matchesCourse =
        courseFilter === "all" || student.enrollments.some((e) => e.courseId === courseFilter)
      return matchesSearch && matchesStatus && matchesCourse
    })
  }, [students, search, statusFilter, courseFilter])

  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortColumn) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "enrollmentDate":
          comparison = getEarliestEnrollmentDate(a).localeCompare(getEarliestEnrollmentDate(b))
          break
        case "progress":
          comparison = calcAvgProgress(a) - calcAvgProgress(b)
          break
        case "lastAccess":
          comparison = a.lastAccess.localeCompare(b.lastAccess)
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return sorted
  }, [filteredStudents, sortColumn, sortDirection])

  const safePage = Math.max(1, Math.min(page, Math.max(1, Math.ceil(sortedStudents.length / pageSize))))
  const paginatedStudents = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sortedStudents.slice(start, start + pageSize)
  }, [sortedStudents, safePage, pageSize])

  const totalPages = Math.ceil(sortedStudents.length / pageSize)
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all" || courseFilter !== "all"

  const handleFilterChange = (newFilter: string, type: "status" | "course" | "search") => {
    setPage(1)
    if (type === "status") setStatusFilter(newFilter)
    else if (type === "course") setCourseFilter(newFilter)
    else setSearch(newFilter)
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setCourseFilter("all")
    setPage(1)
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setDetailsOpen(true)
  }

  const handleSaveStudent = async (data: StudentFormData) => {
    try {
      await createStudent.mutateAsync({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        courseIds: data.courseIds,
        status: data.status,
        phone: data.phone?.trim() || undefined,
        birthDate: data.birthDate || undefined,
        redirectTo: lxpAlunosSetPasswordUrl,
      })
      toast.success("Aluno criado com convite enviado por e-mail.")
      setDialogOpen(false)
    } catch (err: unknown) {
      if (isPlanLimitError(err)) {
        toast.error(err.message)
        return
      }
      toast.error(getAdminErrorMessage("students-create", err))
    }
  }

  const handleEditStudent = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    setProfileEditStudent(student)
    setProfileEditOpen(true)
  }

  const handleProfileEditOpenChange = (open: boolean) => {
    setProfileEditOpen(open)
    if (!open) setProfileEditStudent(null)
  }

  const handleSaveProfile = async (values: StudentProfileEditFormValues) => {
    if (!profileEditStudent) return
    try {
      await updateStudentProfile.mutateAsync({
        profileId: profileEditStudent.id,
        name: values.name.trim(),
        email: profileEditStudent.email,
        phone: values.phone?.trim() ?? "",
        birthDate: values.birthDate?.trim() ?? "",
      })
      await setStudentAccess.mutateAsync({
        profileId: profileEditStudent.id,
        status: values.status,
      })
      toast.success("Dados do aluno atualizados.")
      handleProfileEditOpenChange(false)
    } catch (err: unknown) {
      toast.error(getAdminErrorMessage("students-update-profile", err))
    }
  }

  const handleDeleteClick = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingStudent(student)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return
    try {
      await deleteStudent.mutateAsync(deletingStudent.id)
      toast.success("Aluno excluído com sucesso.")
      setDeletingStudent(null)
      setDeleteDialogOpen(false)
    } catch (err: unknown) {
      toast.error(getAdminErrorMessage("students-delete", err))
    }
  }

  const handleToggleBlock = async (student: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await setStudentAccess.mutateAsync({
        profileId: student.id,
        status: student.status === "blocked" ? "active" : "blocked",
      })
      toast.success(
        student.status === "blocked"
          ? "Acesso global do aluno desbloqueado."
          : "Acesso global do aluno bloqueado.",
      )
    } catch (err: unknown) {
      toast.error(getAdminErrorMessage("students-access", err))
    }
  }

  const handleSendEmail = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.href = `mailto:${student.email}`
  }

  const handleResetPassword = async (student: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    const redirectTo = lxpAlunosSetPasswordUrl
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(student.email, { redirectTo })
    if (resetErr) {
      toast.error("Não foi possível enviar o e-mail de redefinição de senha.")
      return
    }
    fireAuditLog({
      action: "student.reset_password",
      entityType: "lxp_profile",
      entityId: student.id,
      metadata: { email: student.email },
    })
    toast.success("E-mail de redefinição de senha enviado.")
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Alunos"
        description="Gerencie os alunos matriculados na plataforma"
      >
        <RequirePermission permission="alunos.criar">
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={studentsAtLimit}
            title={
              studentsAtLimit
                ? "Limite de alunos do plano atingido. Faça upgrade em Configurações."
                : undefined
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
        </RequirePermission>
      </PageHeader>

      <PlanLimitBanner resource="students" status={planUsage?.students} />

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os alunos</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{getAdminErrorMessage("students-list", error)}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <StudentsStatsCards students={students} isLoading={isLoading} />

      <StudentsToolbar
        search={search}
        statusFilter={statusFilter}
        courseFilter={courseFilter}
        courses={(coursesList ?? []).map((course) => ({ id: course.id, name: course.name }))}
        hasActiveFilters={hasActiveFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      <StudentsTable
        isLoading={isLoading}
        students={paginatedStudents}
        sortedCount={sortedStudents.length}
        hasActiveFilters={hasActiveFilters}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        page={page}
        safePage={safePage}
        pageSize={pageSize}
        totalPages={totalPages}
        onSort={handleSort}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        onViewStudent={handleViewStudent}
        onEditStudent={handleEditStudent}
        onResetPassword={handleResetPassword}
        onSendEmail={handleSendEmail}
        onToggleBlock={handleToggleBlock}
        onDeleteClick={handleDeleteClick}
      />

      <StudentsPageDialogs
        detailsOpen={detailsOpen}
        onDetailsOpenChange={setDetailsOpen}
        selectedStudent={selectedStudent}
        dialogOpen={dialogOpen}
        onDialogOpenChange={handleDialogClose}
        courses={(coursesList ?? []).map((course) => ({
          id: course.id,
          name: course.name,
          category: course.category,
        }))}
        onSaveStudent={handleSaveStudent}
        isCreateSubmitting={createStudent.isPending}
        profileEditStudent={profileEditStudent}
        profileEditOpen={profileEditOpen}
        onProfileEditOpenChange={handleProfileEditOpenChange}
        onSaveProfile={handleSaveProfile}
        isProfileSubmitting={updateStudentProfile.isPending}
        deleteDialogOpen={deleteDialogOpen}
        onDeleteDialogOpenChange={setDeleteDialogOpen}
        deletingStudent={deletingStudent}
        onConfirmDelete={handleConfirmDelete}
      />
    </AdminLayout>
  )
}

export default StudentsPage

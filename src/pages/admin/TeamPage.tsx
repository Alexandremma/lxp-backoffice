import { useMemo, useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus } from "lucide-react"
import { RequirePermission } from "@/components/auth/RequirePermission"
import { formatTeamDepartmentLabel, resolveTeamDepartment, type TeamRole } from "@/consts/teamRoles"
import { toast } from "sonner"
import { useGetTeamMembersAdmin } from "@/hooks/queries/useGetTeamMembersAdmin"
import type { TeamMemberAdminRow } from "@/types/team"
import type { TeamMemberFormData } from "@/components/admin/TeamMemberDialog"
import { useUpsertTeamMemberAdmin } from "@/hooks/mutations/useUpsertTeamMemberAdmin"
import { useDeleteTeamMemberAdmin } from "@/hooks/mutations/useDeleteTeamMemberAdmin"
import { PlanLimitBanner } from "@/components/admin/settings/PlanLimitBanner"
import { getAdminErrorMessage } from "@/lib/adminErrorMessage"
import { isPlanLimitError } from "@/lib/planLimits"
import { usePlanLimits } from "@/hooks/queries/usePlanLimits"
import { useResendTeamInviteAdmin } from "@/hooks/mutations/useResendTeamInviteAdmin"
import { backofficeSetPasswordUrl } from "@/lib/authRedirectUrls"
import { TeamStatsCards } from "@/components/admin/team/TeamStatsCards"
import { TeamToolbar } from "@/components/admin/team/TeamToolbar"
import { TeamTable } from "@/components/admin/team/TeamTable"
import { TeamPageDialogs } from "@/components/admin/team/TeamPageDialogs"
import { toTeamMemberDialogModel } from "@/components/admin/team/teamPageHelpers"

const TeamPage = () => {
  const { data, isLoading, isError, error, refetch } = useGetTeamMembersAdmin()
  const { usage: planUsage } = usePlanLimits()
  const teamAtLimit = planUsage?.teamMembers.atLimit ?? false
  const upsertMember = useUpsertTeamMemberAdmin()
  const deleteMember = useDeleteTeamMemberAdmin()
  const resendInvite = useResendTeamInviteAdmin()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | TeamRole>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMemberAdminRow | null>(null)
  const [deletingMember, setDeletingMember] = useState<TeamMemberAdminRow | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const members = useMemo(() => data ?? [], [data])

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase()
    return members.filter((member) => {
      const deptLabel = formatTeamDepartmentLabel(member.department, member.role).toLowerCase()
      const matchesSearch =
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        deptLabel.includes(q)
      const matchesRole = roleFilter === "all" || member.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [members, search, roleFilter])
  const hasActiveFilters = search.trim().length > 0 || roleFilter !== "all"

  const countByRole = useMemo(() => {
    const counts: Record<TeamRole, number> = {
      admin: 0,
      coordinator: 0,
      professor: 0,
    }
    for (const member of members) {
      const key = member.role in counts ? member.role : "professor"
      counts[key] += 1
    }
    return counts
  }, [members])

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize))
  const safePage = Math.max(1, Math.min(page, totalPages))
  const start = (safePage - 1) * pageSize
  const paginatedMembers = filteredMembers.slice(start, start + pageSize)

  const handleOpenCreate = () => {
    setEditingMember(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (member: TeamMemberAdminRow) => {
    setEditingMember(member)
    setDialogOpen(true)
  }

  const handleSaveDialog = async (values: TeamMemberFormData) => {
    const departmentNorm =
      values.department ?? resolveTeamDepartment(null, values.role as TeamRole) ?? null
    try {
      if (editingMember) {
        await upsertMember.mutateAsync({
          mode: "update",
          id: editingMember.id,
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          role: values.role as TeamRole,
          department: departmentNorm,
        })
        toast.success("Membro atualizado com sucesso.")
      } else {
        await upsertMember.mutateAsync({
          mode: "create",
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          role: values.role as TeamRole,
          department: departmentNorm,
          redirectTo: backofficeSetPasswordUrl,
        })
        toast.success("Membro adicionado e convite enviado por e-mail.")
      }
      setDialogOpen(false)
      setEditingMember(null)
    } catch (err: unknown) {
      if (isPlanLimitError(err)) {
        toast.error(err.message)
        return
      }
      toast.error(getAdminErrorMessage("team-save", err))
    }
  }

  const handleDeleteMember = (member: TeamMemberAdminRow) => {
    setDeletingMember(member)
    setDeleteOpen(true)
  }

  const handleResendInvite = async (member: TeamMemberAdminRow) => {
    try {
      await resendInvite.mutateAsync({
        email: member.email,
        redirectTo: backofficeSetPasswordUrl,
      })
      toast.success("Convite reenviado por e-mail.")
    } catch (err: unknown) {
      toast.error(getAdminErrorMessage("team-save", err))
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingMember) return
    try {
      await deleteMember.mutateAsync(deletingMember.id)
      toast.success("Membro removido da equipe.")
      setDeleteOpen(false)
      setDeletingMember(null)
    } catch (err: unknown) {
      toast.error(getAdminErrorMessage("team-delete", err))
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Equipe"
        description="Visualize e mantenha a equipe administrativa do Backoffice."
      >
        <RequirePermission permission="equipe.criar">
          <Button
            onClick={handleOpenCreate}
            disabled={teamAtLimit}
            title={teamAtLimit ? "Limite de membros da equipe atingido" : undefined}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Membro
          </Button>
        </RequirePermission>
      </PageHeader>

      <PlanLimitBanner resource="teamMembers" status={planUsage?.teamMembers} />

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar a equipe</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{getAdminErrorMessage("team-list", error)}</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <TeamStatsCards isLoading={isLoading} countByRole={countByRole} />

      <TeamToolbar
        search={search}
        roleFilter={roleFilter}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        onRoleFilterChange={(value) => {
          setRoleFilter(value)
          setPage(1)
        }}
        onClearFilters={() => {
          setSearch("")
          setRoleFilter("all")
          setPage(1)
        }}
      />

      <TeamTable
        isLoading={isLoading}
        members={paginatedMembers}
        filteredTotal={filteredMembers.length}
        hasActiveFilters={hasActiveFilters}
        page={safePage}
        pageSize={pageSize}
        totalPages={totalPages}
        start={start}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        onEdit={handleOpenEdit}
        onResendInvite={(member) => void handleResendInvite(member)}
        onDelete={handleDeleteMember}
      />

      <TeamPageDialogs
        dialogOpen={dialogOpen}
        onDialogOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingMember(null)
        }}
        member={editingMember ? toTeamMemberDialogModel(editingMember) : null}
        onSave={(values) => void handleSaveDialog(values)}
        isSubmitting={upsertMember.isPending}
        deleteOpen={deleteOpen}
        onDeleteOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setDeletingMember(null)
        }}
        deletingMemberName={deletingMember?.name ?? null}
        onConfirmDelete={() => void handleConfirmDelete()}
      />
    </AdminLayout>
  )
}

export default TeamPage

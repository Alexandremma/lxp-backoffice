import type { ElementType } from "react"
import { GraduationCap, Shield, UserCog } from "lucide-react"
import { TEAM_ROLE_LABELS, type TeamRole } from "@/consts/teamRoles"
import type { TeamMemberAdminRow } from "@/types/team"
import type { TeamMemberDialogMember } from "@/components/admin/TeamMemberDialog"

export const roleConfig: Record<
  TeamRole,
  {
    label: string
    icon: ElementType
    badgeVariant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
  }
> = {
  admin: { label: TEAM_ROLE_LABELS.admin, icon: Shield, badgeVariant: "destructive" },
  coordinator: { label: TEAM_ROLE_LABELS.coordinator, icon: UserCog, badgeVariant: "info" },
  professor: { label: TEAM_ROLE_LABELS.professor, icon: GraduationCap, badgeVariant: "default" },
}

export function toTeamMemberDialogModel(row: TeamMemberAdminRow): TeamMemberDialogMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
  }
}

import type { TeamRole } from "@/consts/teamRoles"

export type TeamMemberAdminRow = {
  id: string
  userId: string
  name: string
  email: string
  role: TeamRole
  department: string | null
  createdAt: string
  updatedAt: string
  updatedBy: string | null
  avatarPath?: string | null
  avatarUpdatedAt?: string | null
}

export type TeamInviteResult = {
  member: TeamMemberAdminRow
  invitationSent: boolean
}

export type UpdateOwnTeamMemberProfileInput = {
  name: string
  department?: string | null
}
